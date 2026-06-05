import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export class EnemyAISystem {
  update(enemies: Enemy[], player: Player, dt: number): void {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      this.updateEnemy(enemy, player, dt);
    }
  }

  private updateEnemy(enemy: Enemy, player: Player, dt: number): void {
    enemy.aiTimer += dt;

    switch (enemy.type) {
      case 'rotSpore':    this.seekPlayer(enemy, player, 1.0); break;
      case 'aphid':       this.aphidBehavior(enemy, player, dt); break;
      case 'caterpillar': this.caterpillarBehavior(enemy, player, dt); break;
      case 'beetle':      this.beetleBehavior(enemy, player, dt); break;
    }
  }

  /** Basic steering toward the player. smoothing controls velocity lerp. */
  private seekPlayer(enemy: Enemy, player: Player, smoothing: number): void {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const targetVX = (dx / dist) * enemy.speed;
    const targetVY = (dy / dist) * enemy.speed;

    enemy.vx += (targetVX - enemy.vx) * smoothing;
    enemy.vy += (targetVY - enemy.vy) * smoothing;

    // Cap to speed
    const spd = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (spd > enemy.speed) {
      enemy.vx = (enemy.vx / spd) * enemy.speed;
      enemy.vy = (enemy.vy / spd) * enemy.speed;
    }
  }

  private aphidBehavior(enemy: Enemy, player: Player, _dt: number): void {
    // Fast, slightly jittery seek
    this.seekPlayer(enemy, player, 0.3);
    // Random jitter
    if (Math.random() < 0.05) {
      enemy.vx += (Math.random() - 0.5) * 40;
      enemy.vy += (Math.random() - 0.5) * 40;
    }
  }

  private caterpillarBehavior(enemy: Enemy, player: Player, _dt: number): void {
    // Sinuous movement: aim toward player but add sine-wave lateral offset
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const forward = { x: dx / dist, y: dy / dist };
    const lateral = { x: -forward.y, y: forward.x };
    const sineAmp = 50;
    const wave = Math.sin(enemy.aiTimer * 2.5) * sineAmp;

    enemy.vx = (forward.x * enemy.speed) + (lateral.x * wave);
    enemy.vy = (forward.y * enemy.speed) + (lateral.y * wave);

    const spd = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
    if (spd > enemy.speed * 1.3) {
      enemy.vx = (enemy.vx / spd) * enemy.speed * 1.3;
      enemy.vy = (enemy.vy / spd) * enemy.speed * 1.3;
    }
  }

  private beetleBehavior(enemy: Enemy, player: Player, _dt: number): void {
    // Normally slow creep, periodically charges straight at the player
    const CHARGE_INTERVAL = 4.0;
    const CHARGE_DURATION = 0.8;

    if (enemy.isCharging) {
      // Continue charge
      const chargeAge = enemy.aiTimer % (CHARGE_INTERVAL + CHARGE_DURATION) - CHARGE_INTERVAL;
      if (chargeAge > CHARGE_DURATION) {
        enemy.isCharging = false;
        enemy.chargeTarget = null;
      }
      // Velocity already set when charge started — just let it continue
    } else {
      this.seekPlayer(enemy, player, 0.06); // slow lerp = sluggish
      // Check if time to charge
      const cycleT = enemy.aiTimer % (CHARGE_INTERVAL + CHARGE_DURATION);
      if (cycleT >= CHARGE_INTERVAL && !enemy.isCharging) {
        enemy.isCharging = true;
        enemy.chargeTarget = { x: player.x, y: player.y };
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const chargeSpeed = enemy.speed * 4;
        enemy.vx = (dx / dist) * chargeSpeed;
        enemy.vy = (dy / dist) * chargeSpeed;
      }
    }
  }
}
