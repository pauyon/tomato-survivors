import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface SprayEffect {
  x: number; y: number;
  angle: number;
  range: number;
  width: number; // half-angle of cone in radians
  life: number;
}

export class PesticideSpray extends Weapon {
  readonly id = 'pesticide_spray';
  readonly name = 'Pesticide Spray';
  readonly description = 'Sprays a toxic cone forward, dealing high damage.';
  readonly icon = '🧪';
  knockback = 50;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 22,  cooldown: 1.8, count: 1, speed: 0, pierce: 99, area: 100, duration: 1, description: 'Sprays a cone forward.' },
    { damage: 28,  cooldown: 1.7, count: 1, speed: 0, pierce: 99, area: 110, duration: 1, description: '+Damage, +Range.' },
    { damage: 34,  cooldown: 1.6, count: 1, speed: 0, pierce: 99, area: 120, duration: 1, description: '+Damage.' },
    { damage: 40,  cooldown: 1.5, count: 2, speed: 0, pierce: 99, area: 120, duration: 1, description: 'Sprays in 2 directions.' },
    { damage: 48,  cooldown: 1.4, count: 2, speed: 0, pierce: 99, area: 130, duration: 1, description: '+Range.' },
    { damage: 58,  cooldown: 1.3, count: 2, speed: 0, pierce: 99, area: 140, duration: 1, description: '+Damage.' },
    { damage: 70,  cooldown: 1.2, count: 3, speed: 0, pierce: 99, area: 145, duration: 1, description: 'Sprays in 3 directions.' },
    { damage: 90,  cooldown: 1.0, count: 4, speed: 0, pierce: 99, area: 160, duration: 1, description: 'MAX: 4-way spray, massive damage.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, area, damage } = this.config;
    const baseDamage = Math.round(damage * player.stats.damageMultiplier);
    const coneHalfAngle = Math.PI / 4; // 45° each side = 90° total cone
    const alreadyHit = new Set<number>();

    // Determine primary direction: toward nearest enemy, or player facing
    const primaryAngle = this.getPrimaryAngle(world, player);

    for (let i = 0; i < count; i++) {
      const angle = primaryAngle + (i / count) * Math.PI * 2;

      // Hit enemies in cone
      for (const enemy of world.enemies) {
        if (!enemy.alive || alreadyHit.has(enemy.id)) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > area + enemy.radius) continue;

        const enemyAngle = Math.atan2(dy, dx);
        let diff = Math.abs(enemyAngle - angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < coneHalfAngle) {
          const { amount, isCrit } = player.rollHit(baseDamage);
          enemy.takeDamage(amount);
          alreadyHit.add(enemy.id);
          if (dist > 0) enemy.applyKnockback(dx / dist, dy / dist, this.knockback);
          world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 5);
          if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
          if (!enemy.alive) world.onEnemyKilled(enemy);
        }
      }

      world.sprayEffects.push({ x: player.x, y: player.y, angle, range: area, width: coneHalfAngle, life: 1 });
    }
  }

  private getPrimaryAngle(world: World, player: Player): number {
    let nearestDist = Infinity;
    let nearestAngle = player.facingRight ? 0 : Math.PI;
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const dist = enemy.distanceTo(player);
      if (dist < nearestDist && dist < 300) {
        nearestDist = dist;
        nearestAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      }
    }
    return nearestAngle;
  }
}
