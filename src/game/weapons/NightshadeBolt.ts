// Nightshade Bolt — calls down lightning on random nearby enemies (tomatoes are
// nightshades). Each strike is instant and hits everything in a small blast radius.
// Modeled on VS's Lightning Ring. World.boltEffects holds visual-only flashes.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface BoltEffect {
  x: number; y: number;
  radius: number;
  life: number; // 1 → 0
  seed: number; // randomizes the jagged path per bolt
}

export class NightshadeBolt extends Weapon {
  readonly id = 'nightshade_bolt';
  readonly name = 'Nightshade Bolt';
  readonly description = 'Strikes random nearby enemies with bolts of nightshade lightning.';
  readonly icon = '⚡';
  knockback = 70;

  // count = number of bolts per cast, area = blast radius of each strike.
  levelConfigs: WeaponLevelConfig[] = [
    { damage: 30,  cooldown: 2.4, count: 1, speed: 0, pierce: 99, area: 50, duration: 1, description: 'Strikes 1 enemy.' },
    { damage: 36,  cooldown: 2.3, count: 2, speed: 0, pierce: 99, area: 52, duration: 1, description: 'Strikes 2 enemies.' },
    { damage: 43,  cooldown: 2.2, count: 2, speed: 0, pierce: 99, area: 56, duration: 1, description: '+Damage, +Blast.' },
    { damage: 51,  cooldown: 2.0, count: 3, speed: 0, pierce: 99, area: 58, duration: 1, description: 'Strikes 3 enemies.' },
    { damage: 61,  cooldown: 1.9, count: 3, speed: 0, pierce: 99, area: 62, duration: 1, description: '+Damage.' },
    { damage: 73,  cooldown: 1.7, count: 4, speed: 0, pierce: 99, area: 66, duration: 1, description: 'Strikes 4 enemies.' },
    { damage: 88,  cooldown: 1.5, count: 5, speed: 0, pierce: 99, area: 70, duration: 1, description: 'Strikes 5 enemies.' },
    { damage: 115, cooldown: 1.2, count: 6, speed: 0, pierce: 99, area: 80, duration: 1, description: 'MAX: 6 bolts, huge blasts.' },
  ];

  private static readonly RANGE = 380; // only target enemies within this distance

  protected fire(world: World, player: Player): void {
    const { count, damage, area } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    // Pick up to `count` distinct nearby enemies as strike points.
    const candidates = world.enemies
      .filter(e => e.alive && e.distanceTo(player) < NightshadeBolt.RANGE)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    if (candidates.length === 0) return;

    for (const target of candidates) {
      this.strike(world, player, target.x, target.y, area, totalDamage);
    }
  }

  /** Blast everything within `radius` of (sx, sy) and spawn the bolt visual. */
  private strike(world: World, player: Player, sx: number, sy: number, radius: number, damage: number): void {
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - sx;
      const dy = enemy.y - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= radius + enemy.radius) continue;

      const { amount, isCrit } = player.rollHit(damage);
      enemy.takeDamage(amount);
      if (dist > 0) enemy.applyKnockback(dx / dist, dy / dist, this.knockback);
      world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 10 : 6);
      if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
      if (!enemy.alive) world.onEnemyKilled(enemy);
    }

    world.particles.spawnDeath(sx, sy, 200, 120, 220, 10);
    world.boltEffects.push({ x: sx, y: sy, radius, life: 1, seed: Math.random() * 1000 });
  }
}
