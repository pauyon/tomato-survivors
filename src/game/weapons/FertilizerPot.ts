// Fertilizer Pot — lobs clay pots that shatter in an AoE (like VS Santa Water).
// Lands at a random position near a nearby enemy, creating a burst of damage.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class FertilizerPot extends Weapon {
  readonly id = 'fertilizer_pot';
  readonly name = 'Fertilizer Pot';
  readonly description = 'Lobs clay pots that shatter on impact. Targets enemy clusters.';
  readonly icon = '🪴';
  knockback = 200;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 35,  cooldown: 2.2, count: 1, speed: 160, pierce: 99, area: 70,  duration: 1.6, description: 'Lobs 1 pot at enemies.' },
    { damage: 44,  cooldown: 2.0, count: 1, speed: 170, pierce: 99, area: 78,  duration: 1.6, description: '+Damage, +Blast radius.' },
    { damage: 52,  cooldown: 1.9, count: 2, speed: 175, pierce: 99, area: 82,  duration: 1.6, description: 'Lobs 2 pots.' },
    { damage: 62,  cooldown: 1.8, count: 2, speed: 180, pierce: 99, area: 88,  duration: 1.7, description: '+Range.' },
    { damage: 74,  cooldown: 1.7, count: 2, speed: 185, pierce: 99, area: 95,  duration: 1.7, description: '+Damage.' },
    { damage: 88,  cooldown: 1.5, count: 3, speed: 195, pierce: 99, area: 100, duration: 1.7, description: 'Lobs 3 pots.' },
    { damage: 105, cooldown: 1.3, count: 3, speed: 205, pierce: 99, area: 108, duration: 1.8, description: '+Blast radius.' },
    { damage: 135, cooldown: 1.1, count: 4, speed: 215, pierce: 99, area: 120, duration: 1.8, description: 'MAX: 4 pots, massive blast.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, area, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    // Find target positions — near visible enemies or random spots
    const targets = this.pickTargets(world, player, count);

    for (const target of targets) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const angle = Math.atan2(dy, dx);

      const proj = new Projectile(
        player.x, player.y,
        angle, speed, totalDamage,
        duration, 'fertPot', 99, 8,
      );
      // Arc: launch upward proportional to distance
      const arcHeight = dist * 0.5;
      proj.vy = -arcHeight - speed * 0.4;
      proj.gravity = (2 * (arcHeight + speed * 0.4 * (dist / speed))) / (duration * duration) + 300;
      proj.aoeRadius = area;
      proj.isAoe = true;
      proj.knockback = this.knockback;
      world.projectiles.push(proj);
    }
  }

  private pickTargets(world: World, player: Player, count: number): { x: number; y: number }[] {
    const range = 350;
    const nearEnemies = world.enemies
      .filter(e => e.alive && e.distanceTo(player) < range)
      .sort((a, b) => a.distanceTo(player) - b.distanceTo(player));

    const targets: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      if (nearEnemies.length > 0) {
        const idx = Math.min(i * 2, nearEnemies.length - 1);
        // Land near (but not exactly on) the enemy for satisfying splash
        targets.push({
          x: nearEnemies[idx].x + (Math.random() - 0.5) * 40,
          y: nearEnemies[idx].y + (Math.random() - 0.5) * 40,
        });
      } else {
        const angle = Math.random() * Math.PI * 2;
        targets.push({ x: player.x + Math.cos(angle) * 150, y: player.y + Math.sin(angle) * 150 });
      }
    }
    return targets;
  }
}
