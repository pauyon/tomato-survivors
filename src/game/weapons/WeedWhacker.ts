// Weed Whacker — instant horizontal slash (like VS Whip).
// Hits all enemies in a wide arc in the player's facing direction, with knockback.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface WhackEffect {
  x: number; y: number;
  angle: number;
  width: number;
  life: number; // 0–1
}

export class WeedWhacker extends Weapon {
  readonly id = 'weed_whacker';
  readonly name = 'Weed Whacker';
  readonly description = 'Swings a wide slash in your facing direction. Knocks enemies back.';
  readonly icon = '🌀';
  knockback = 220;

  levelConfigs: WeaponLevelConfig[] = [
    { damage: 28,  cooldown: 1.2, count: 1, speed: 0, pierce: 99, area: 110, duration: 1, description: 'Slashes forward. Knockback.' },
    { damage: 36,  cooldown: 1.1, count: 1, speed: 0, pierce: 99, area: 120, duration: 1, description: '+Damage, +Range.' },
    { damage: 44,  cooldown: 1.0, count: 2, speed: 0, pierce: 99, area: 125, duration: 1, description: 'Slashes both directions.' },
    { damage: 54,  cooldown: 0.9, count: 2, speed: 0, pierce: 99, area: 132, duration: 1, description: '+Range.' },
    { damage: 65,  cooldown: 0.85, count: 2, speed: 0, pierce: 99, area: 140, duration: 1, description: '+Damage.' },
    { damage: 78,  cooldown: 0.80, count: 3, speed: 0, pierce: 99, area: 148, duration: 1, description: 'Slashes in 3 directions.' },
    { damage: 94,  cooldown: 0.75, count: 3, speed: 0, pierce: 99, area: 158, duration: 1, description: '+Damage, stronger knockback.' },
    { damage: 120, cooldown: 0.65, count: 4, speed: 0, pierce: 99, area: 170, duration: 1, description: 'MAX: 4-way slash, massive knockback.' },
  ];

  protected fire(world: World, player: Player): void {
    const { count, area: range, damage } = this.config;
    const baseDamage = Math.round(damage * player.stats.damageMultiplier);
    const alreadyHit = new Set<number>();
    const coneHalf = Math.PI / 2.2; // ~82° total cone per slash

    const baseAngle = player.facingRight ? 0 : Math.PI;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i / count) * Math.PI * 2;

      for (const enemy of world.enemies) {
        if (!enemy.alive || alreadyHit.has(enemy.id)) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > range + enemy.radius) continue;

        const eAngle = Math.atan2(dy, dx);
        let diff = Math.abs(eAngle - angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < coneHalf) {
          const { amount, isCrit } = player.rollHit(baseDamage);
          enemy.takeDamage(amount);
          alreadyHit.add(enemy.id);
          // Strong knockback in the slash direction (scales a little with level)
          enemy.applyKnockback(Math.cos(angle), Math.sin(angle), this.knockback + this.level * 12);
          world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 12 : 8);
          if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
          if (!enemy.alive) world.onEnemyKilled(enemy);
        }
      }

      world.whackEffects.push({ x: player.x, y: player.y, angle, width: range, life: 1 });
    }
  }
}
