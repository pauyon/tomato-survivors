// Garden Axe — arcing throw (like VS Axe).
// High single-target damage, predictable arc that falls on enemies ahead.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class GardenAxe extends Weapon {
  readonly id = 'garden_axe';
  readonly name = 'Garden Axe';
  readonly description = 'Hurls a spinning axe in an arcing trajectory. High damage.';
  readonly icon = '🪓';
  knockback = 120;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 40,  cooldown: 2.0, count: 1, speed: 200, pierce: 1, area: 1, duration: 1.4, description: 'Throws 1 arcing axe.' },
    { damage: 50,  cooldown: 1.9, count: 1, speed: 210, pierce: 1, area: 1, duration: 1.4, description: '+Damage.' },
    { damage: 60,  cooldown: 1.8, count: 2, speed: 210, pierce: 1, area: 1, duration: 1.4, description: 'Throws 2 axes.' },
    { damage: 72,  cooldown: 1.7, count: 2, speed: 220, pierce: 2, area: 1, duration: 1.4, description: 'Axes pierce 2 enemies.' },
    { damage: 86,  cooldown: 1.6, count: 2, speed: 230, pierce: 2, area: 1, duration: 1.5, description: '+Damage, +Arc height.' },
    { damage: 100, cooldown: 1.4, count: 3, speed: 240, pierce: 2, area: 1, duration: 1.5, description: 'Throws 3 axes.' },
    { damage: 118, cooldown: 1.2, count: 3, speed: 250, pierce: 3, area: 1, duration: 1.5, description: 'Axes pierce 3 enemies.' },
    { damage: 150, cooldown: 1.0, count: 4, speed: 260, pierce: 4, area: 1, duration: 1.6, description: 'MAX: 4 axes, 4-pierce.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, pierce, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    for (let i = 0; i < count; i++) {
      // Spread multiple axes slightly
      const spreadAngle = (i - (count - 1) / 2) * 0.3;
      // Throw forward (toward facing direction) with slight upward arc
      const baseAngle = player.facingRight ? 0 : Math.PI;
      const angle = baseAngle + spreadAngle;

      const proj = new Projectile(
        player.x, player.y,
        angle, speed, totalDamage,
        duration, 'axe', pierce, 10,
      );
      // Upward launch + gravity = arc
      proj.vy = -speed * 0.6;
      proj.gravity = 600;
      proj.knockback = this.knockback;
      world.projectiles.push(proj);
    }
  }
}
