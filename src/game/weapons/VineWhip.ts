import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

// VineWhip doesn't create projectiles — it lashes enemies directly in arcs to the
// player's left and right. World.vineWhipEffects holds visual-only data for RenderSystem.
export interface VineWhipEffect {
  x: number; y: number;
  angle: number;
  radius: number;
  life: number; // 0–1 remaining
}

export class VineWhip extends Weapon {
  readonly id = 'vine_whip';
  readonly name = 'Vine Whip';
  readonly description = 'Lashes thorny vines to your left and right.';
  readonly icon = '🌿';
  knockback = 80;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 18,  cooldown: 1.4, count: 1, speed: 0, pierce: 99, area: 60,  duration: 1, description: 'Lashes left and right.' },
    { damage: 22,  cooldown: 1.3, count: 1, speed: 0, pierce: 99, area: 65,  duration: 1, description: '+Damage, +Range.' },
    { damage: 26,  cooldown: 1.2, count: 2, speed: 0, pierce: 99, area: 65,  duration: 1, description: '+Damage, wider arc.' },
    { damage: 30,  cooldown: 1.1, count: 2, speed: 0, pierce: 99, area: 72,  duration: 1, description: '+Damage, bigger arc.' },
    { damage: 36,  cooldown: 1.0, count: 3, speed: 0, pierce: 99, area: 80,  duration: 1, description: '+Range, wider arc.' },
    { damage: 42,  cooldown: 0.9, count: 3, speed: 0, pierce: 99, area: 80,  duration: 1, description: '+Damage.' },
    { damage: 50,  cooldown: 0.8, count: 4, speed: 0, pierce: 99, area: 88,  duration: 1, description: '+Damage, wider arc.' },
    { damage: 65,  cooldown: 0.7, count: 4, speed: 0, pierce: 99, area: 100, duration: 1, description: 'MAX: huge range, wide arcs.' },
  ];

  // Seconds after the right strike before the left strike fires. Tuned so the
  // left lashes out just as the right is finishing (right lash lifetime ≈ 0.31s).
  private static readonly LEFT_DELAY = 0.22;
  private pendingLeft = -1; // <0 = nothing scheduled

  tick(dt: number, world: World, player: Player): boolean {
    // Resolve a scheduled left strike before the normal cooldown logic.
    if (this.pendingLeft >= 0) {
      this.pendingLeft -= dt;
      if (this.pendingLeft <= 0) {
        this.pendingLeft = -1;
        this.strike(world, player, Math.PI); // left
      }
    }
    return super.tick(dt, world, player);
  }

  protected fire(world: World, player: Player): void {
    this.strike(world, player, 0);             // right now
    this.pendingLeft = VineWhip.LEFT_DELAY;    // left a beat later
  }

  /** Lash one side: damage + knockback enemies in the arc and spawn the visual. */
  private strike(world: World, player: Player, angle: number): void {
    const { count, area, damage } = this.config;
    const baseDamage = Math.round(damage * player.stats.damageMultiplier);
    // The whip is a straight horizontal lash, so its hitbox is a RECTANGULAR BAND
    // along the strike direction — not an angular cone. A cone fans out and misses
    // enemies sitting just below the thin vine; a band reliably hits anything
    // on/under the lash within reach.
    const dirX = Math.cos(angle), dirY = Math.sin(angle);
    const reach = area;
    const halfThickness = 30 + (count - 1) * 6; // vertical reach of the band; grows per level
    const alreadyHit = new Set<number>();

    for (const enemy of world.enemies) {
      if (!enemy.alive || alreadyHit.has(enemy.id)) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const along = dx * dirX + dy * dirY;            // distance out along the lash
      const perp = Math.abs(dx * -dirY + dy * dirX);  // distance off the lash line
      if (along < -enemy.radius) continue;            // behind the player
      if (along > reach + enemy.radius) continue;     // past the tip
      if (perp > halfThickness + enemy.radius) continue; // outside the band

      const { amount, isCrit } = player.rollHit(baseDamage);
      enemy.takeDamage(amount);
      alreadyHit.add(enemy.id);
      const dist = Math.hypot(dx, dy) || 1;
      enemy.applyKnockback(dx / dist, dy / dist, this.knockback);
      world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 5);
      if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
      if (!enemy.alive) world.onEnemyKilled(enemy);
    }

    // Spawn the visual near the body so the sprite lines up with the hit band
    // (which is centered on the player). Small lift keeps it at torso height.
    const OFFSET = 10;
    const LIFT = 10;
    world.vineWhipEffects.push({
      x: player.x + Math.cos(angle) * OFFSET,
      y: player.y - LIFT,
      angle, radius: area, life: 1,
    });
  }
}
