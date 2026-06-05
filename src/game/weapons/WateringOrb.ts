// Watering Orb — a glowing orb that orbits the player (like VS King Bible).
// Continuously damages enemies it passes through. Overrides tick() for every-frame update.

import { Weapon } from './Weapon';
import type { WeaponLevelConfig } from './Weapon';
import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface OrbitalPosition {
  x: number;
  y: number;
  orbRadius: number; // visual size of the orb
}

export class WateringOrb extends Weapon {
  readonly id = 'watering_orb';
  readonly name = 'Watering Orb';
  readonly description = 'A magic water orb orbits you, damaging nearby enemies on contact.';
  readonly icon = '💧';
  knockback = 90;

  private angle = 0;
  // Per-enemy cooldown: cannot hit same enemy more than once per 0.8s
  private hitCooldowns = new Map<number, number>();

  levelConfigs: WeaponLevelConfig[] = [
    // speed = rotation speed (rad/s), area = orbit radius
    { damage: 20,  cooldown: 0, count: 1, speed: 2.0, pierce: 99, area: 80,  duration: 1, description: '1 orb orbits you.' },
    { damage: 26,  cooldown: 0, count: 1, speed: 2.2, pierce: 99, area: 85,  duration: 1, description: '+Damage, faster orbit.' },
    { damage: 32,  cooldown: 0, count: 2, speed: 2.2, pierce: 99, area: 90,  duration: 1, description: '2 orbs orbit you.' },
    { damage: 40,  cooldown: 0, count: 2, speed: 2.4, pierce: 99, area: 95,  duration: 1, description: '+Orbit radius.' },
    { damage: 50,  cooldown: 0, count: 2, speed: 2.6, pierce: 99, area: 100, duration: 1, description: '+Damage.' },
    { damage: 62,  cooldown: 0, count: 3, speed: 2.6, pierce: 99, area: 108, duration: 1, description: '3 orbs orbit you.' },
    { damage: 76,  cooldown: 0, count: 3, speed: 2.8, pierce: 99, area: 118, duration: 1, description: '+Range, +Damage.' },
    { damage: 100, cooldown: 0, count: 4, speed: 3.0, pierce: 99, area: 130, duration: 1, description: 'MAX: 4 orbs, wide orbit.' },
  ];

  // Override tick() entirely — orbital weapons don't use cooldown-based fire()
  tick(dt: number, world: World, player: Player): boolean {
    const { count, speed, area: orbitRadius, damage } = this.config;
    const baseDamage = Math.round(damage * player.stats.damageMultiplier);

    this.angle += speed * dt;

    // Decay hit cooldowns
    for (const [id, t] of this.hitCooldowns) {
      const newT = t - dt;
      if (newT <= 0) this.hitCooldowns.delete(id);
      else this.hitCooldowns.set(id, newT);
    }

    // Update orbital positions on World for the renderer
    world.orbitalPositions = [];
    for (let i = 0; i < count; i++) {
      const orbAngle = this.angle + (i / count) * Math.PI * 2;
      const ox = player.x + Math.cos(orbAngle) * orbitRadius;
      const oy = player.y + Math.sin(orbAngle) * orbitRadius;
      world.orbitalPositions.push({ x: ox, y: oy, orbRadius: 12 });

      // Collision with enemies
      for (const enemy of world.enemies) {
        if (!enemy.alive || this.hitCooldowns.has(enemy.id)) continue;
        const dx = ox - enemy.x;
        const dy = oy - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 12 + enemy.radius) {
          const { amount, isCrit } = player.rollHit(baseDamage);
          enemy.takeDamage(amount);
          this.hitCooldowns.set(enemy.id, 0.75);
          // Push the enemy away from the orb
          if (dist > 0) enemy.applyKnockback(-dx / dist, -dy / dist, this.knockback);
          world.particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 5);
          if (isCrit && enemy.alive) world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
          if (!enemy.alive) world.onEnemyKilled(enemy);
        }
      }
    }
    return false;
  }

  // Required by abstract base — never called since tick() is overridden
  protected fire(_world: World, _player: Player): void {}
}
