import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import { Projectile } from '../entities/Projectile';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export class CompostBomb extends Weapon {
  readonly id = 'compost_bomb';
  readonly name = 'Compost Bomb';
  readonly description = 'Lobs an explosive compost ball at the nearest enemy cluster.';
  readonly icon = '💣';
  knockback = 220;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 30,  cooldown: 3.0, count: 1, speed: 180, pierce: 99, area: 80,  duration: 1.2, description: 'Explodes in an area.' },
    { damage: 38,  cooldown: 2.8, count: 1, speed: 190, pierce: 99, area: 85,  duration: 1.2, description: '+Damage, bigger blast.' },
    { damage: 46,  cooldown: 2.6, count: 2, speed: 190, pierce: 99, area: 90,  duration: 1.2, description: 'Fires 2 bombs.' },
    { damage: 55,  cooldown: 2.4, count: 2, speed: 200, pierce: 99, area: 95,  duration: 1.2, description: '+Range.' },
    { damage: 65,  cooldown: 2.2, count: 2, speed: 200, pierce: 99, area: 100, duration: 1.2, description: '+Damage.' },
    { damage: 78,  cooldown: 2.0, count: 3, speed: 210, pierce: 99, area: 105, duration: 1.2, description: 'Fires 3 bombs.' },
    { damage: 92,  cooldown: 1.8, count: 3, speed: 220, pierce: 99, area: 115, duration: 1.2, description: '+Damage, +Speed.' },
    { damage: 120, cooldown: 1.5, count: 4, speed: 230, pierce: 99, area: 130, duration: 1.2, description: 'MAX: 4 bombs, massive blast.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, speed, damage, area, duration } = this.config;
    const totalDamage = Math.round(damage * player.stats.damageMultiplier);

    // Find densest enemy cluster direction using a simple angle vote
    const targets = this.findTargetAngles(world, player, count);

    for (let i = 0; i < count; i++) {
      const angle = targets[i] ?? Math.random() * Math.PI * 2;
      const proj = new Projectile(
        player.x, player.y,
        angle, speed, totalDamage,
        duration, 'compostBlast', 99, 6,
      );
      proj.aoeRadius = area;
      proj.isAoe = true;
      proj.knockback = this.knockback;
      world.projectiles.push(proj);
    }
  }

  private findTargetAngles(world: World, player: Player, count: number): number[] {
    const visible = world.enemies
      .filter(e => e.alive)
      .map(e => ({ angle: Math.atan2(e.y - player.y, e.x - player.x), dist: e.distanceTo(player) }))
      .filter(e => e.dist < 400)
      .sort((a, b) => a.dist - b.dist);

    if (visible.length === 0) {
      return Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2);
    }

    // Cluster nearest enemies
    const angles: number[] = [];
    for (let i = 0; i < Math.min(count, visible.length); i++) {
      angles.push(visible[Math.floor(i * (visible.length / count))].angle);
    }
    while (angles.length < count) angles.push(visible[0].angle + Math.random() * 0.4 - 0.2);
    return angles;
  }
}
