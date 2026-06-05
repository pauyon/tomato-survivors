import { Obstacle, randomObstacleType } from '../entities/Obstacle';
import type { Player } from '../entities/Player';
import type { Camera } from '../../engine/Camera';

// Keeps a sparse field of obstacles around the player: spawns new ones at the
// edge of view as the player moves, and culls ones left far behind.
export class ObstacleSystem {
  private spawnTimer = 0;
  private readonly targetCount = 16;
  private readonly cullDistance = 1500;
  private readonly minSpacing = 70; // keep props from overlapping each other / the player

  update(dt: number, obstacles: Obstacle[], player: Player, camera: Camera): Obstacle[] {
    // Cull far-away obstacles (mutates in place via returned filter in World)
    this.spawnTimer -= dt;

    const kept = obstacles.filter(o => o.alive && o.distanceToPoint(player.x, player.y) < this.cullDistance);

    if (this.spawnTimer <= 0 && kept.length < this.targetCount) {
      this.spawnTimer = 0.8;
      const spawned = this.trySpawn(kept, player, camera);
      if (spawned) kept.push(spawned);
    }

    return kept;
  }

  private trySpawn(existing: Obstacle[], player: Player, camera: Camera): Obstacle | null {
    const bounds = camera.getBounds(60);
    // Spawn just outside the visible area on a random edge (like enemies).
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;
    switch (edge) {
      case 0: x = bounds.left + Math.random() * (bounds.right - bounds.left); y = bounds.top - 40; break;
      case 1: x = bounds.left + Math.random() * (bounds.right - bounds.left); y = bounds.bottom + 40; break;
      case 2: x = bounds.left - 40; y = bounds.top + Math.random() * (bounds.bottom - bounds.top); break;
      default: x = bounds.right + 40; y = bounds.top + Math.random() * (bounds.bottom - bounds.top); break;
    }

    // Reject if too close to the player or another obstacle.
    if (Math.hypot(x - player.x, y - player.y) < 120) return null;
    for (const o of existing) {
      if (Math.hypot(x - o.x, y - o.y) < this.minSpacing) return null;
    }

    return new Obstacle(x, y, randomObstacleType());
  }
}
