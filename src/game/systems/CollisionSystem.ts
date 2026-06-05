import { SpatialHash } from '../../engine/SpatialHash';
import type { Camera } from '../../engine/Camera';
import type { World } from '../World';
import type { Enemy } from '../entities/Enemy';
import type { XPGem, GoldCoin } from '../entities/XPGem';

export class CollisionSystem {
  private enemyHash = new SpatialHash<Enemy>(64);
  private gemHash   = new SpatialHash<XPGem>(64);
  private coinHash  = new SpatialHash<GoldCoin>(64);

  update(world: World, camera: Camera): void {
    const { player, enemies, projectiles, xpGems, goldCoins, particles } = world;

    // Rebuild hashes
    this.enemyHash.rebuild(enemies.filter(e => e.alive));
    this.gemHash.rebuild(xpGems.filter(g => g.alive));
    this.coinHash.rebuild(goldCoins.filter(c => c.alive));

    // --- Projectiles vs enemies ---
    for (const proj of projectiles) {
      if (!proj.alive) continue;

      if (proj.isAoe) {
        // AoE: explode on lifetime end — handled in World.explodeAoe
        continue;
      }

      const nearby = this.enemyHash.query(proj.x, proj.y, proj.radius + 20);
      for (const enemy of nearby) {
        if (!enemy.alive) continue;
        if (proj.piercedIds.has(enemy.id)) continue;

        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < proj.radius + enemy.radius) {
          const { amount, isCrit } = player.rollHit(proj.damage);
          enemy.takeDamage(amount);
          proj.piercedIds.add(enemy.id);
          particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 5);

          // Knockback along the projectile's travel direction
          if (proj.knockback > 0) {
            const len = Math.hypot(proj.vx, proj.vy) || 1;
            enemy.applyKnockback(proj.vx / len, proj.vy / len, proj.knockback);
          }

          if (!enemy.alive) {
            world.onEnemyKilled(enemy);
          } else if (isCrit) {
            world.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
          }

          if (proj.piercedIds.size >= proj.piercing) {
            proj.alive = false;
            break;
          }
        }
      }

      // Projectiles vs destructible obstacles (crates / bushes)
      if (proj.alive) {
        for (const o of world.obstacles) {
          if (!o.alive || !o.destructible) continue;
          const dx = proj.x - o.x;
          const dy = proj.y - o.y;
          if (Math.sqrt(dx * dx + dy * dy) < proj.radius + o.radius) {
            o.takeDamage(proj.damage);
            particles.spawnHit(o.x, o.y);
            if (!o.alive) world.onObstacleDestroyed(o);
            if (proj.piercing < 99) proj.alive = false; // non-piercing shots are consumed
            break;
          }
        }
      }
    }

    // --- Enemies vs player ---
    if (!player.isInvincible) {
      const nearbyEnemies = this.enemyHash.query(player.x, player.y, player.radius + 20);
      for (const enemy of nearbyEnemies) {
        if (!enemy.alive) continue;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + enemy.radius - 4) {
          player.takeDamage(enemy.damage);
          camera.shake(5);
          break; // only one enemy can hit per iframe window
        }
      }
    }

    // --- XP gems vs player (magnet radius) ---
    const magnetR = player.stats.magnetRadius;
    const nearbyGems = this.gemHash.query(player.x, player.y, magnetR + 10);
    for (const gem of nearbyGems) {
      if (!gem.alive) continue;
      const dx = gem.x - player.x;
      const dy = gem.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetR) {
        // Accelerate toward player
        const speed = 200 + (magnetR - dist) * 3;
        gem.vx = (-dx / dist) * speed;
        gem.vy = (-dy / dist) * speed;
      }

      if (dist < player.radius + gem.radius + 4) {
        gem.alive = false;
        player.addXP(gem.value);
        particles.spawnXPCollect(gem.x, gem.y);
      }
    }

    // --- Gold coins vs player ---
    const nearbyCoins = this.coinHash.query(player.x, player.y, magnetR + 10);
    for (const coin of nearbyCoins) {
      if (!coin.alive) continue;
      const dx = coin.x - player.x;
      const dy = coin.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetR * 0.8) {
        const speed = 180 + (magnetR * 0.8 - dist) * 3;
        coin.vx = (-dx / dist) * speed;
        coin.vy = (-dy / dist) * speed;
      }

      if (dist < player.radius + coin.radius + 4) {
        coin.alive = false;
        player.addGold(coin.value);
      }
    }

    // --- Health drops vs player (magnet-able like coins) ---
    for (const drop of world.healthDrops) {
      if (!drop.alive) continue;
      const dx = drop.x - player.x;
      const dy = drop.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetR * 0.8) {
        const speed = 180 + (magnetR * 0.8 - dist) * 3;
        drop.vx = (-dx / dist) * speed;
        drop.vy = (-dy / dist) * speed;
      }

      if (dist < player.radius + drop.radius + 4) {
        drop.alive = false;
        player.heal(drop.value);
        particles.spawnXPCollect(drop.x, drop.y);
      }
    }

    // --- Treasure chests vs player (walk onto to open; consumed by World) ---
    for (const chest of world.chests) {
      if (!chest.alive) continue;
      const dx = chest.x - player.x;
      const dy = chest.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < player.radius + chest.radius) {
        world.touchedChest = chest;
        break;
      }
    }
  }
}
