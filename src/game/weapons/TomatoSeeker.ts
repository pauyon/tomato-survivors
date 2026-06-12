// Tomato Seeker — homing tomatoes that curve toward enemies (like a missile
// weapon). Low per-hit damage but they chase targets relentlessly.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class TomatoSeeker extends Weapon {
  readonly id = 'tomato_seeker';
  readonly name = 'Tomato Seeker';
  readonly description = 'Launches homing tomatoes that chase down enemies.';
  readonly icon = '🍅';
  knockback = 50;

  // speed = projectile speed, area = turn rate scalar (higher = sharper homing).
  levelConfigs: WeaponLevelConfig[] = [
    { damage: 14, cooldown: 1.5,  count: 2, speed: 200, pierce: 1, area: 1.0, duration: 1.4, description: 'Fires 2 homing tomatoes.' },
    { damage: 17, cooldown: 1.4,  count: 2, speed: 210, pierce: 1, area: 1.1, duration: 1.4, description: '+Damage, sharper homing.' },
    { damage: 20, cooldown: 1.3,  count: 3, speed: 210, pierce: 1, area: 1.1, duration: 1.5, description: 'Fires 3 tomatoes.' },
    { damage: 24, cooldown: 1.2,  count: 3, speed: 220, pierce: 2, area: 1.2, duration: 1.5, description: 'Tomatoes pierce 2 enemies.' },
    { damage: 29, cooldown: 1.1,  count: 4, speed: 230, pierce: 2, area: 1.2, duration: 1.6, description: 'Fires 4 tomatoes.' },
    { damage: 35, cooldown: 1.0,  count: 4, speed: 240, pierce: 2, area: 1.3, duration: 1.6, description: '+Damage, +Speed.' },
    { damage: 42, cooldown: 0.9,  count: 5, speed: 250, pierce: 3, area: 1.4, duration: 1.7, description: 'Fires 5 tomatoes, pierce 3.' },
    { damage: 56, cooldown: 0.75, count: 6, speed: 260, pierce: 3, area: 1.6, duration: 1.8, description: 'MAX: 6 relentless seekers.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, pierce, area, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    // Aim each tomato at a nearby enemy when possible; otherwise fan out.
    const targets = this.nearestEnemyAngles(world, player, count);

    for (let i = 0; i < count; i++) {
      const angle = targets[i] ?? (i / count) * Math.PI * 2;
      const proj = new Projectile(
        player.x, player.y,
        angle, speed, totalDamage,
        1.6 * duration, 'tomato', pierce, 6,
      );
      proj.knockback = this.knockback;
      proj.homing = true;
      proj.homingTurnRate = 3.2 * area; // area scales how tightly they curve
      proj.homingRange = 420;
      world.projectiles.push(proj);
    }
  }

  /** Angles toward the `count` nearest enemies (falls back to a fan when sparse). */
  private nearestEnemyAngles(world: World, player: Player, count: number): number[] {
    const sorted = world.enemies
      .filter(e => e.alive)
      .map(e => ({ angle: Math.atan2(e.y - player.y, e.x - player.x), dist: e.distanceTo(player) }))
      .sort((a, b) => a.dist - b.dist);

    const angles: number[] = [];
    for (let i = 0; i < count; i++) {
      if (sorted[i]) angles.push(sorted[i].angle);
      else if (sorted.length > 0) angles.push(sorted[i % sorted.length].angle + (Math.random() - 0.5) * 0.8);
      else angles.push((i / count) * Math.PI * 2);
    }
    return angles;
  }
}
