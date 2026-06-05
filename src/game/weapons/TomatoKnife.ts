// Tomato Knife — fast piercing projectile toward the nearest enemy (like VS Knife).
// Low cooldown, low damage, but fires rapidly and pierces at higher levels.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class TomatoKnife extends Weapon {
  readonly id = 'tomato_knife';
  readonly name = 'Tomato Knife';
  readonly description = 'Hurls sharp tomato slices at the nearest enemy. Fast and accurate.';
  readonly icon = '🔪';
  knockback = 60;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 15,  cooldown: 0.55, count: 1, speed: 380, pierce: 1, area: 1, duration: 1.0, description: 'Fires 1 knife at nearest enemy.' },
    { damage: 18,  cooldown: 0.50, count: 1, speed: 400, pierce: 1, area: 1, duration: 1.0, description: '+Damage, +Speed.' },
    { damage: 22,  cooldown: 0.48, count: 2, speed: 400, pierce: 1, area: 1, duration: 1.0, description: 'Fires 2 knives.' },
    { damage: 26,  cooldown: 0.45, count: 2, speed: 420, pierce: 2, area: 1, duration: 1.0, description: 'Knives pierce 2 enemies.' },
    { damage: 32,  cooldown: 0.42, count: 3, speed: 430, pierce: 2, area: 1, duration: 1.0, description: 'Fires 3 knives.' },
    { damage: 38,  cooldown: 0.40, count: 3, speed: 450, pierce: 2, area: 1, duration: 1.1, description: '+Damage, +Speed.' },
    { damage: 46,  cooldown: 0.36, count: 4, speed: 460, pierce: 3, area: 1, duration: 1.1, description: 'Fires 4 knives, pierce 3.' },
    { damage: 60,  cooldown: 0.30, count: 5, speed: 480, pierce: 4, area: 1, duration: 1.2, description: 'MAX: 5 knives, 4-pierce, rapid fire.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, pierce, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    const baseAngle = this.findNearestAngle(world, player);
    const spread = 0.12; // radians between knives

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      const proj = new Projectile(
        player.x, player.y,
        baseAngle + offset, speed, totalDamage,
        duration, 'knife', pierce, 4,
      );
      proj.knockback = this.knockback;
      world.projectiles.push(proj);
    }
  }

  private findNearestAngle(world: World, player: Player): number {
    let nearest = Infinity;
    let angle = player.facingRight ? 0 : Math.PI;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const dist = enemy.distanceTo(player);
      if (dist < nearest) {
        nearest = dist;
        angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      }
    }
    return angle;
  }
}
