import type { Camera } from '../../engine/Camera';
import type { World } from '../World';
import { getCharacterSprite } from '../../assets/placeholders/CharacterSprites';
import { drawRotSpore, drawAphid, drawCaterpillar, drawBeetle } from '../../assets/placeholders/EnemySprites';
import { drawEnemySprite } from '../../assets/EnemySpriteRenderer';
import { drawSeedProjectile, drawXPGem, drawGoldCoin, drawHeart, drawTreasureChest, drawObstacle, drawVineWhipSprite, drawCompostExplosion } from '../../assets/placeholders/EffectSprites';
import fieldTexture from '../../assets/field.png';
import type { SprayEffect } from '../weapons/PesticideSpray';

const TILE_SIZE = 128;

export class RenderSystem {
  private time = 0;
  private fieldImg = (() => { const i = new Image(); i.src = fieldTexture; return i; })();
  private fieldPattern: CanvasPattern | null = null;

  render(ctx: CanvasRenderingContext2D, world: World, camera: Camera, alpha: number): void {
    this.time += 1 / 60;
    const { width, height } = ctx.canvas;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // World transform
    ctx.save();
    camera.applyTransform(ctx);

    // 1. Background tiles
    this.renderBackground(ctx, camera);

    const t = this.time;

    // 1b. Obstacles (ground props, drawn under entities)
    for (const o of world.obstacles) {
      if (!o.alive) continue;
      ctx.save();
      if (o.hitFlash > 0) ctx.filter = 'brightness(180%)';
      drawObstacle(ctx, o.x, o.y, o.type, o.radius);
      ctx.restore();
      if (o.destructible && o.hp < o.maxHp) {
        this.renderHPBar(ctx, o.x, o.y - o.radius - 6, o.hpFraction, o.radius * 2);
      }
    }

    // 2. XP gems (sorted by Y for depth)
    const sortedGems = world.xpGems.filter(g => g.alive).sort((a, b) => a.y - b.y);
    for (const gem of sortedGems) {
      const pos = gem.renderPos(alpha);
      drawXPGem(ctx, pos.x, pos.y + gem.floatOffset, gem.value, t);
    }

    // Gold coins
    for (const coin of world.goldCoins.filter(c => c.alive)) {
      const pos = coin.renderPos(alpha);
      drawGoldCoin(ctx, pos.x, pos.y, t);
    }

    // Health drops
    for (const drop of world.healthDrops.filter(d => d.alive)) {
      const pos = drop.renderPos(alpha);
      drawHeart(ctx, pos.x, pos.y, t);
    }

    // Treasure chests
    for (const chest of world.chests.filter(c => c.alive)) {
      const pos = chest.renderPos(alpha);
      drawTreasureChest(ctx, pos.x, pos.y, t);
    }

    // 3. Enemies (sorted by Y for pseudo-depth)
    const sortedEnemies = world.enemies.filter(e => e.alive).sort((a, b) => a.y - b.y);
    for (const enemy of sortedEnemies) {
      const pos = enemy.renderPos(alpha);

      ctx.save();
      if (enemy.hitFlash > 0) {
        ctx.filter = `brightness(300%) saturate(0%)`;
      }

      // Use the real sprite sheet if loaded; otherwise fall back to the placeholder.
      if (!drawEnemySprite(ctx, enemy.type, pos.x, pos.y, enemy.animTime, enemy.vx)) {
        switch (enemy.type) {
          case 'rotSpore':    drawRotSpore(ctx, pos.x, pos.y, enemy.animTime);    break;
          case 'aphid':       drawAphid(ctx, pos.x, pos.y, enemy.animTime);       break;
          case 'caterpillar': drawCaterpillar(ctx, pos.x, pos.y, enemy.animTime); break;
          case 'beetle':      drawBeetle(ctx, pos.x, pos.y, enemy.animTime);      break;
        }
      }
      ctx.restore();

      // HP bar (only when damaged)
      if (enemy.hp < enemy.maxHp) {
        this.renderHPBar(ctx, pos.x, pos.y - enemy.radius - 8, enemy.hpFraction, enemy.radius * 2);
      }
    }

    // 4. Player
    this.renderPlayer(ctx, world, alpha, t);

    // 5. Projectiles
    for (const proj of world.projectiles.filter(p => p.alive)) {
      const pos = proj.renderPos(alpha);
      switch (proj.type) {
        case 'seed':
          drawSeedProjectile(ctx, pos.x, pos.y, proj.angle, proj.speed * 0.01);
          break;
        case 'axe':
          this.renderAxe(ctx, pos.x, pos.y, proj.spinAngle, proj.lifeFraction);
          break;
        case 'fertPot':
          this.renderFertPot(ctx, pos.x, pos.y, proj.spinAngle);
          break;
        case 'knife':
          this.renderKnife(ctx, pos.x, pos.y, proj.angle);
          break;
        case 'compostBlast':
          drawCompostExplosion(ctx, pos.x, pos.y, proj.aoeRadius * (1 - proj.lifeFraction) * 0.5 + 6, proj.lifeFraction);
          break;
        case 'pesticide':
          break; // handled via spray effects
      }
    }

    // 6. Weapon effects
    for (const vfx of world.vineWhipEffects) {
      drawVineWhipSprite(ctx, vfx.x, vfx.y, vfx.radius, vfx.angle, vfx.life);
    }
    for (const spray of world.sprayEffects) {
      this.renderSprayEffect(ctx, spray);
    }
    for (const whack of world.whackEffects) {
      this.renderWhackEffect(ctx, whack);
    }

    // 6b. Orbital positions (Watering Orb)
    for (const orb of world.orbitalPositions) {
      this.renderWaterOrb(ctx, orb.x, orb.y, orb.orbRadius, t);
    }

    // 7. Particles
    world.particles.render(ctx);

    ctx.restore(); // end world transform

    // 8. Screen-space: damage numbers
    this.renderDamageNumbers(ctx, world, camera, alpha);
  }

  private renderBackground(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const bounds = camera.getBounds(TILE_SIZE);
    const w = bounds.right - bounds.left;
    const h = bounds.bottom - bounds.top;

    // Lazily build the repeating grass pattern once the image has decoded.
    // The texture is downscaled once into an offscreen canvas so its features
    // read smaller next to the character (and so tiling stays crisp/stable).
    if (!this.fieldPattern && this.fieldImg.complete && this.fieldImg.naturalWidth > 0) {
      const FIELD_SCALE = 0.3; // <1 = smaller grass features relative to the world
      const sw = Math.round(this.fieldImg.naturalWidth * FIELD_SCALE);
      const sh = Math.round(this.fieldImg.naturalHeight * FIELD_SCALE);
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const cx = c.getContext('2d');
      if (cx) {
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = 'high';
        cx.drawImage(this.fieldImg, 0, 0, sw, sh);
        this.fieldPattern = ctx.createPattern(c, 'repeat');
      }
    }

    if (this.fieldPattern) {
      ctx.save();
      ctx.imageSmoothingEnabled = false; // keep the pixel-art grass crisp
      ctx.fillStyle = this.fieldPattern;
      // Pattern is anchored to world (0,0), so it scrolls with the world transform.
      ctx.fillRect(bounds.left, bounds.top, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#4a7c2f'; // fallback solid until the texture loads
      ctx.fillRect(bounds.left, bounds.top, w, h);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, world: World, alpha: number, _t: number): void {
    const { player } = world;
    const pos = player.renderPos(alpha);

    // Invincibility flash
    if (player.iframes > 0) {
      const flashRate = Math.sin(player.iframes * 30);
      if (flashRate < 0) return; // blink
    }

    const drawSprite = getCharacterSprite(world.characterId);
    drawSprite(ctx, pos.x, pos.y, player.state, player.animFrame, player.facingRight);

    // Small health bar under the player (only when not at full HP)
    if (player.hp < player.stats.maxHp) {
      this.renderHPBar(ctx, pos.x, pos.y + player.radius + 8, player.hp / player.stats.maxHp, 28);
    }
  }

  private renderHPBar(ctx: CanvasRenderingContext2D, cx: number, y: number, fraction: number, width: number): void {
    const h = 4;
    const x = cx - width / 2;
    ctx.fillStyle = '#500';
    ctx.fillRect(x, y, width, h);
    ctx.fillStyle = fraction > 0.5 ? '#4f4' : fraction > 0.25 ? '#ff4' : '#f44';
    ctx.fillRect(x, y, width * fraction, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, width, h);
  }

  private renderSprayEffect(ctx: CanvasRenderingContext2D, spray: SprayEffect): void {
    ctx.save();
    ctx.translate(spray.x, spray.y);
    ctx.rotate(spray.angle);
    ctx.globalAlpha = spray.life * 0.5;

    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, spray.range);
    grad.addColorStop(0, 'rgba(120,220,60,0.8)');
    grad.addColorStop(0.5, 'rgba(80,180,40,0.5)');
    grad.addColorStop(1, 'rgba(40,140,20,0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, spray.range, -spray.width, spray.width);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  private renderDamageNumbers(ctx: CanvasRenderingContext2D, world: World, camera: Camera, _alpha: number): void {
    const now = performance.now() / 1000;
    for (const dn of world.damageNumbers) {
      const age = now - dn.spawnTime;
      if (age > dn.lifetime) continue;
      const t = age / dn.lifetime;
      const screen = camera.worldToScreen(dn.x, dn.y - age * 40);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.font = `bold ${dn.isCrit ? 18 : 14}px 'Courier New', monospace`;
      ctx.fillStyle = dn.isCrit ? '#ff4444' : '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(String(dn.amount), screen.x, screen.y);
      ctx.fillText(String(dn.amount), screen.x, screen.y);
      ctx.restore();
    }
  }

  private renderAxe(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number, _life: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    // Handle
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.lineTo(0, -8);
    ctx.strokeStyle = '#8b6240'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.stroke();
    // Blade
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.bezierCurveTo(10, -10, 14, -2, 6, 4);
    ctx.bezierCurveTo(2, 6, -2, 2, 0, -4);
    ctx.fillStyle = '#c0c0d0';
    ctx.fill();
    ctx.strokeStyle = '#808090'; ctx.lineWidth = 1;
    ctx.stroke();
    // Sheen
    ctx.beginPath();
    ctx.moveTo(2, -4); ctx.lineTo(10, -8);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  private renderFertPot(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.4);
    // Pot body
    ctx.beginPath();
    ctx.moveTo(-7, -8); ctx.lineTo(-9, 4); ctx.lineTo(9, 4); ctx.lineTo(7, -8); ctx.closePath();
    ctx.fillStyle = '#c87840'; ctx.fill();
    ctx.strokeStyle = '#8b5020'; ctx.lineWidth = 1.2; ctx.stroke();
    // Rim
    ctx.beginPath();
    ctx.ellipse(0, -8, 7, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d89050'; ctx.fill();
    ctx.stroke();
    // Contents (green fertilizer)
    ctx.beginPath();
    ctx.ellipse(0, -7, 4, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5aaa30';
    ctx.fill();
    // Trail
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,180,40,0.4)';
    ctx.fill();
    ctx.restore();
  }

  private renderKnife(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Blade
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -2.5);
    ctx.lineTo(-6, 2.5);
    ctx.closePath();
    ctx.fillStyle = '#e0e0f0'; ctx.fill();
    ctx.strokeStyle = '#9090a0'; ctx.lineWidth = 0.8; ctx.stroke();
    // Sheen
    ctx.beginPath();
    ctx.moveTo(8, -0.8); ctx.lineTo(-2, -1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
    ctx.stroke();
    // Handle
    ctx.beginPath();
    ctx.rect(-10, -2, 5, 4);
    ctx.fillStyle = '#8b4020'; ctx.fill();
    ctx.restore();
  }

  private renderWaterOrb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number): void {
    ctx.save();
    ctx.translate(x, y);
    const pulse = 0.85 + Math.sin(t * 5) * 0.08;
    ctx.scale(pulse, pulse);
    // Outer glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 8);
    glow.addColorStop(0, 'rgba(80,200,255,0.35)');
    glow.addColorStop(1, 'rgba(80,200,255,0)');
    ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
    // Core
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
    grad.addColorStop(0, '#c0f0ff');
    grad.addColorStop(0.5, '#40b8f0');
    grad.addColorStop(1, '#1060a0');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(160,230,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Inner gleam
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.restore();
  }

  private renderWhackEffect(ctx: CanvasRenderingContext2D, whack: { x: number; y: number; angle: number; width: number; life: number }): void {
    ctx.save();
    ctx.translate(whack.x, whack.y);
    ctx.rotate(whack.angle);
    ctx.globalAlpha = whack.life * 0.7;
    const grad = ctx.createRadialGradient(0, 0, 0, whack.width * 0.5, 0, whack.width);
    grad.addColorStop(0, 'rgba(200,255,100,0.9)');
    grad.addColorStop(0.4, 'rgba(100,220,60,0.6)');
    grad.addColorStop(1, 'rgba(40,180,20,0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, whack.width, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // Arc outline
    ctx.beginPath();
    ctx.arc(0, 0, whack.width, -Math.PI / 2.4, Math.PI / 2.4);
    ctx.strokeStyle = 'rgba(180,255,80,0.8)'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}
