import { Enemy } from '../entities/Enemy';
import { pickEnemyType, scaledDef } from '../enemies/EnemyRegistry';
import type { Player } from '../entities/Player';
import type { Camera } from '../../engine/Camera';

// Spawns enemies off-screen at regular intervals, ramping difficulty over time.
export class WaveSystem {
  private spawnTimer = 0;

  private baseSpawnInterval = 1.2; // seconds between spawns at t=0

  /** Returns new enemies to add to the world this tick. */
  update(dt: number, elapsed: number, player: Player, camera: Camera): Enemy[] {
    this.spawnTimer -= dt;

    const newEnemies: Enemy[] = [];
    if (this.spawnTimer <= 0) {
      const count = this.spawnCount(elapsed);
      for (let i = 0; i < count; i++) {
        const enemy = this.spawnOne(elapsed, player, camera);
        if (enemy) newEnemies.push(enemy);
      }
      this.spawnTimer = this.currentInterval(elapsed);
    }
    return newEnemies;
  }

  private currentInterval(elapsed: number): number {
    // Halves over 2 minutes, minimum 0.25s
    return Math.max(0.25, this.baseSpawnInterval * Math.pow(0.5, elapsed / 120));
  }

  private spawnCount(elapsed: number): number {
    if (elapsed < 30) return 1;
    if (elapsed < 120) return 2;
    if (elapsed < 300) return 3;
    return 4 + Math.floor(elapsed / 120);
  }

  private spawnOne(elapsed: number, player: Player, camera: Camera): Enemy | null {
    const type = pickEnemyType(elapsed);
    const isElite = elapsed > 480 && Math.random() < 0.15;
    const def = scaledDef(type, elapsed, isElite ? 2 : 0);

    const { x, y } = this.spawnPosition(player, camera);
    const enemy = new Enemy(x, y, def);
    if (isElite) {
      // Elites are bigger and have a subtle color tint (handled in render)
      enemy.isElite = true;
      enemy.radius *= 1.3;
    }
    return enemy;
  }

  private spawnPosition(_player: Player, camera: Camera): { x: number; y: number } {
    const bounds = camera.getBounds(80);
    // Spawn just outside the visible area on a random edge
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;
    switch (edge) {
      case 0: x = bounds.left  + Math.random() * (bounds.right - bounds.left); y = bounds.top    - 20; break;
      case 1: x = bounds.left  + Math.random() * (bounds.right - bounds.left); y = bounds.bottom + 20; break;
      case 2: x = bounds.left  - 20; y = bounds.top + Math.random() * (bounds.bottom - bounds.top);    break;
      default:x = bounds.right + 20; y = bounds.top + Math.random() * (bounds.bottom - bounds.top);    break;
    }
    return { x, y };
  }
}
