// Marinara Aura — a pungent garlic-and-tomato cloud around the player that damages
// any enemy inside it (like VS's Garlic). Continuous, no projectiles. Overrides
// tick() for every-frame damage. World.auraEffects holds the visual ring.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface AuraEffect {
  x: number; y: number;
  radius: number;
}

export class MarinaraAura extends Weapon {
  readonly id = 'marinara_aura';
  readonly name = 'Marinara Aura';
  readonly description = 'A reeking garlic-tomato cloud that damages all nearby enemies.';
  readonly icon = '🧄';
  knockback = 30;

  // area = aura radius, cooldown = re-hit interval per enemy (via hitInterval).
  levelConfigs: WeaponLevelConfig[] = [
    { damage: 8,  cooldown: 0, count: 1, speed: 0, pierce: 99, area: 64,  duration: 0.7, description: 'Damaging aura around you.' },
    { damage: 10, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 70,  duration: 0.7, description: '+Damage, +Radius.' },
    { damage: 12, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 78,  duration: 0.65, description: '+Radius, faster ticks.' },
    { damage: 15, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 86,  duration: 0.6, description: '+Damage.' },
    { damage: 18, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 94,  duration: 0.55, description: '+Radius, faster ticks.' },
    { damage: 22, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 104, duration: 0.5, description: '+Damage.' },
    { damage: 27, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 116, duration: 0.45, description: '+Radius, faster ticks.' },
    { damage: 36, cooldown: 0, count: 1, speed: 0, pierce: 99, area: 132, duration: 0.4, description: 'MAX: huge, fast-pulsing aura.' },
  ];

  // Per-enemy re-hit timers so an enemy is damaged once per `duration` interval.
  private hitCooldowns = new Map<number, number>();

  tick(dt: number, world: World, player: Player): boolean {
    const { area: radius, damage, duration: hitInterval } = this.config;
    const baseDamage = Math.round(damage * player.stats.damageMultiplier);

    // Decay per-enemy cooldowns.
    for (const [id, t] of this.hitCooldowns) {
      const nt = t - dt;
      if (nt <= 0) this.hitCooldowns.delete(id);
      else this.hitCooldowns.set(id, nt);
    }

    // Publish the visual ring (centered on the player) for the renderer.
    world.auraEffects = [{ x: player.x, y: player.y, radius }];

    for (const enemy of world.enemies) {
      if (!enemy.alive || this.hitCooldowns.has(enemy.id)) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= radius + enemy.radius) continue;

      const { amount, isCrit } = player.rollHit(baseDamage);
      enemy.takeDamage(amount);
      this.hitCooldowns.set(enemy.id, hitInterval);
      if (dist > 0) enemy.applyKnockback(dx / dist, dy / dist, this.knockback);
      world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 4);
      if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
      if (!enemy.alive) world.onEnemyKilled(enemy);
    }
    return false;
  }

  // Required by the abstract base — never used since tick() is overridden.
  protected fire(_world: World, _player: Player): void {}
}
