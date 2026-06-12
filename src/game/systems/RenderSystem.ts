import type { Camera } from '../../engine/Camera';
import type { World } from '../World';
import { getCharacterSprite } from '../../assets/placeholders/CharacterSprites';
import { drawRotSpore, drawAphid, drawCaterpillar, drawBeetle } from '../../assets/placeholders/EnemySprites';
import { drawEnemySprite } from '../../assets/EnemySpriteRenderer';
import { drawAttackSprite } from '../../assets/AttackSprites';
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

    // 1c. Marinara aura (ground cloud, drawn under entities)
    for (const aura of world.auraEffects) {
      this.renderAura(ctx, aura.x, aura.y, aura.radius, t);
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

    // Treasure chests (with an on-screen highlight so they're easy to spot)
    for (const chest of world.chests.filter(c => c.alive)) {
      const pos = chest.renderPos(alpha);
      this.renderChestGlow(ctx, pos.x, pos.y, t);
      drawTreasureChest(ctx, pos.x, pos.y, t);
      this.renderChestArrow(ctx, pos.x, pos.y, t);
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
          if (!drawAttackSprite(ctx, 'seed', pos.x, pos.y, { width: 22, animTime: proj.animTime }))
            drawSeedProjectile(ctx, pos.x, pos.y, proj.angle, proj.speed * 0.01);
          break;
        case 'axe':
          // Sheet animates its own spin, so cycle frames by life rather than rotating.
          if (!drawAttackSprite(ctx, 'garden-axe', pos.x, pos.y, { width: 38, animTime: proj.animTime }))
            this.renderAxe(ctx, pos.x, pos.y, proj.spinAngle, proj.lifeFraction);
          break;
        case 'fertPot':
          if (!drawAttackSprite(ctx, 'fertilizer-pot', pos.x, pos.y, { width: 34, animTime: proj.animTime }))
            this.renderFertPot(ctx, pos.x, pos.y, proj.spinAngle);
          break;
        case 'knife':
          if (!drawAttackSprite(ctx, 'tomato-knife', pos.x, pos.y, { width: 38, rotation: proj.angle, animTime: proj.animTime }))
            this.renderKnife(ctx, pos.x, pos.y, proj.angle);
          break;
        case 'tomato':
          if (!drawAttackSprite(ctx, 'tomato-seeker', pos.x, pos.y, { width: 30, rotation: proj.angle, animTime: proj.animTime }))
            this.renderTomato(ctx, pos.x, pos.y, proj.angle, t);
          break;
        case 'compostBlast':
          // Flying compost bomb (the explosion plays separately via blastEffects).
          if (!drawAttackSprite(ctx, 'compost-bomb', pos.x, pos.y, { width: 32, animTime: proj.animTime }))
            drawCompostExplosion(ctx, pos.x, pos.y, proj.aoeRadius * (1 - proj.lifeFraction) * 0.5 + 6, proj.lifeFraction);
          break;
        case 'pesticide':
          break; // handled via spray effects
      }
    }

    // 6. Weapon effects. Cone attacks anchor their apex (left-center of the
    //    sheet) on the strike origin and rotate to the strike angle.
    for (const vfx of world.vineWhipEffects) {
      if (!drawAttackSprite(ctx, 'vine-whip', vfx.x, vfx.y, {
        width: vfx.radius * 1.7, rotation: vfx.angle, anchorX: 0.04, anchorY: 0.5,
        progress: 1 - vfx.life, alpha: Math.min(1, vfx.life * 2),
      })) {
        drawVineWhipSprite(ctx, vfx.x, vfx.y, vfx.radius, vfx.angle, vfx.life);
      }
    }
    for (const spray of world.sprayEffects) {
      if (!drawAttackSprite(ctx, 'pesticide-spray', spray.x, spray.y, {
        width: spray.range * 1.15, rotation: spray.angle, anchorX: 0.04, anchorY: 0.5,
        progress: 1 - spray.life, alpha: Math.min(1, spray.life * 2),
      })) {
        this.renderSprayEffect(ctx, spray);
      }
    }
    for (const whack of world.whackEffects) {
      if (!drawAttackSprite(ctx, 'weed-whacker', whack.x, whack.y, {
        width: whack.width * 1.15, rotation: whack.angle, anchorX: 0.04, anchorY: 0.5,
        progress: 1 - whack.life, alpha: Math.min(1, whack.life * 2),
      })) {
        this.renderWhackEffect(ctx, whack);
      }
    }

    // 6b. Orbital positions (Watering Orb)
    for (const orb of world.orbitalPositions) {
      this.renderWaterOrb(ctx, orb.x, orb.y, orb.orbRadius, t);
    }

    // 6c. Lightning bolts (Nightshade Bolt) — drawn on top of enemies
    for (const bolt of world.boltEffects) {
      this.renderBolt(ctx, bolt.x, bolt.y, bolt.radius, bolt.life, bolt.seed);
    }

    // 6d. AoE detonations (compost / fertilizer) — play their explosion sheet.
    for (const bl of world.blastEffects) {
      const id = bl.kind === 'fertilizer' ? 'fertilizer-splash' : 'compost-blast';
      drawAttackSprite(ctx, id, bl.x, bl.y, { width: bl.radius * 2.3, progress: 1 - bl.life });
    }

    // 7. Particles
    world.particles.render(ctx);

    ctx.restore(); // end world transform

    // 8. Screen-space: damage numbers
    this.renderDamageNumbers(ctx, world, camera, alpha);

    // 9. Screen-space: off-screen treasure-chest markers (VS-style edge arrows)
    this.renderChestIndicators(ctx, world, camera);
  }

  /** Pulsing golden glow ring under an on-screen chest (drawn before the chest). */
  private renderChestGlow(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
    const pulse = (Math.sin(t * 4) + 1) / 2; // 0..1
    const r = 22 + pulse * 8;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, r * 0.45, x, y, r + 10);
    grad.addColorStop(0, 'rgba(255,216,74,0)');
    grad.addColorStop(0.6, `rgba(255,216,74,${0.22 + pulse * 0.18})`);
    grad.addColorStop(1, 'rgba(255,216,74,0)');
    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  /** Bobbing downward chevron floating above an on-screen chest (drawn on top). */
  private renderChestArrow(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
    const bob = Math.sin(t * 4) * 4;
    ctx.save();
    ctx.translate(x, y - 32 + bob);
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(-10, -5);
    ctx.lineTo(10, -5);
    ctx.closePath();
    ctx.fillStyle = '#ffd84a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw a pulsing arrow + chest icon pinned to the screen edge for every chest
   * that's currently off-screen, so the player can track down distant loot.
   */
  private renderChestIndicators(ctx: CanvasRenderingContext2D, world: World, camera: Camera): void {
    const { width, height } = ctx.canvas;
    const cx = width / 2;
    const cy = height / 2;
    const padding = 64;                 // keep the whole (bigger) marker on screen
    const halfW = width / 2 - padding;
    const halfH = height / 2 - padding;
    const edgeMargin = 32;              // treat as on-screen (no marker) within this slack

    for (const chest of world.chests) {
      if (!chest.alive) continue;
      const s = camera.worldToScreen(chest.x, chest.y);
      const onScreen = s.x >= -edgeMargin && s.x <= width + edgeMargin
                    && s.y >= -edgeMargin && s.y <= height + edgeMargin;
      if (onScreen) continue;

      const dx = s.x - cx;
      const dy = s.y - cy;
      if (dx === 0 && dy === 0) continue;

      // Project the direction onto the inset screen rectangle to find the edge point.
      const t = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
      const mx = cx + dx * t;
      const my = cy + dy * t;
      const angle = Math.atan2(dy, dx);
      const pulse = 1 + Math.sin(this.time * 6) * 0.14;

      ctx.save();
      ctx.translate(mx, my);

      // Soft glow behind the badge so it pops against busy backgrounds.
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
      glow.addColorStop(0, 'rgba(255,216,74,0.45)');
      glow.addColorStop(1, 'rgba(255,216,74,0)');
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Badge with chest icon (pulses to draw the eye).
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20,16,8,0.88)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#caa030';
      ctx.stroke();
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎁', 0, 1);
      ctx.restore();

      // Arrow protruding outward, pointing toward the chest.
      ctx.rotate(angle);
      ctx.translate(26, 0);
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-5, -10);
      ctx.lineTo(-5, 10);
      ctx.closePath();
      ctx.fillStyle = '#ffd84a';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
      ctx.stroke();

      ctx.restore();
    }
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

  /** A small homing tomato with a stem and a soft trail. */
  private renderTomato(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, t: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Trail behind the direction of travel.
    const tx = -Math.cos(angle) * 10;
    const ty = -Math.sin(angle) * 10;
    const trail = ctx.createRadialGradient(tx, ty, 0, tx, ty, 9);
    trail.addColorStop(0, 'rgba(255,90,70,0.4)');
    trail.addColorStop(1, 'rgba(255,90,70,0)');
    ctx.beginPath();
    ctx.arc(tx, ty, 9, 0, Math.PI * 2);
    ctx.fillStyle = trail;
    ctx.fill();

    // Body
    const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 6);
    grad.addColorStop(0, '#ff8a6a');
    grad.addColorStop(0.6, '#e03020');
    grad.addColorStop(1, '#a01810');
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.arc(-2, -2.5, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Little green stem, gently bobbing.
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(2 + Math.sin(t * 8) * 1.5, -10, 4, -11);
    ctx.strokeStyle = '#4a9a30';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();
  }

  /** A jagged lightning bolt striking down to (x, y) with an impact flash. */
  private renderBolt(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, life: number, seed: number): void {
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 1.4);

    // Impact flash on the ground.
    const flash = ctx.createRadialGradient(x, y, 2, x, y, radius);
    flash.addColorStop(0, 'rgba(245,230,255,0.85)');
    flash.addColorStop(0.5, 'rgba(190,120,230,0.45)');
    flash.addColorStop(1, 'rgba(150,80,210,0)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = flash;
    ctx.fill();

    // Jagged bolt from above down to the impact point (deterministic per seed).
    const top = y - 230;
    const segments = 7;
    ctx.beginPath();
    ctx.moveTo(x, top);
    for (let i = 1; i < segments; i++) {
      const f = i / segments;
      const jag = Math.sin(seed + i * 2.3) * 16 * (1 - f); // settles onto the target
      ctx.lineTo(x + jag, top + (y - top) * f);
    }
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#f0e0ff';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#c890ff';
    ctx.shadowBlur = 12;
    ctx.stroke();
    // Bright inner core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  /** A pulsing translucent garlic-tomato cloud around the player. */
  private renderAura(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, t: number): void {
    const pulse = 0.94 + Math.sin(t * 4) * 0.06;
    const r = radius * pulse;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, 'rgba(220,70,50,0.05)');
    grad.addColorStop(0.7, 'rgba(210,80,55,0.18)');
    grad.addColorStop(1, 'rgba(200,70,50,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    // Faint garlic-green rim
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150,200,90,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
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
