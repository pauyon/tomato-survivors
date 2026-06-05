import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class SeedShot extends Weapon {
  readonly id = 'seed_shot';
  readonly name = 'Seed Shot';
  readonly description = 'Fires seeds in all directions automatically.';
  readonly icon = '🌱';
  knockback = 30;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 12,  cooldown: 1.2, count: 4,  speed: 220, pierce: 1, area: 1, duration: 1, description: 'Fires 4 seeds.' },
    { damage: 14,  cooldown: 1.1, count: 4,  speed: 240, pierce: 1, area: 1, duration: 1, description: '+Damage, +Speed.' },
    { damage: 16,  cooldown: 1.0, count: 6,  speed: 240, pierce: 1, area: 1, duration: 1, description: 'Now fires 6 seeds.' },
    { damage: 18,  cooldown: 0.9, count: 6,  speed: 260, pierce: 2, area: 1, duration: 1, description: 'Seeds pierce 2 enemies.' },
    { damage: 22,  cooldown: 0.9, count: 8,  speed: 260, pierce: 2, area: 1, duration: 1, description: 'Now fires 8 seeds.' },
    { damage: 26,  cooldown: 0.8, count: 8,  speed: 280, pierce: 2, area: 1, duration: 1, description: '+Damage, faster cooldown.' },
    { damage: 30,  cooldown: 0.7, count: 8,  speed: 280, pierce: 3, area: 1, duration: 1, description: 'Seeds pierce 3 enemies.' },
    { damage: 40,  cooldown: 0.6, count: 8,  speed: 300, pierce: 4, area: 1, duration: 1, description: 'MAX: Heavy seeds, 4-pierce.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, pierce, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const proj = new Projectile(
        player.x, player.y,
        angle, speed, totalDamage,
        1.4 * duration, 'seed', pierce, 5,
      );
      proj.knockback = this.knockback;
      world.projectiles.push(proj);
    }
  }
}
