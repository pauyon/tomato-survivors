import { Player, type PlayerStats } from './entities/Player';
import type { Entity } from './entities/Entity';
import { Enemy } from './entities/Enemy';
import { Projectile } from './entities/Projectile';
import { XPGem, GoldCoin } from './entities/XPGem';
import { HealthDrop, TreasureChest } from './entities/Pickups';
import { Obstacle } from './entities/Obstacle';
import { buildLevelUpOptions, type ChestReward } from './upgrades/UpgradeRegistry';
import { WaveSystem } from './systems/WaveSystem';
import { CollisionSystem } from './systems/CollisionSystem';
import { ObstacleSystem } from './systems/ObstacleSystem';
import { EnemyAISystem } from './systems/EnemyAISystem';
import { ParticleSystem } from './systems/ParticleSystem';
import type { Weapon } from './weapons/Weapon';
import { createWeapon, applyPerkToWeapon, type WeaponId } from './weapons/WeaponRegistry';
import type { VineWhipEffect } from './weapons/VineWhip';
import type { SprayEffect } from './weapons/PesticideSpray';
import type { OrbitalPosition } from './weapons/WateringOrb';
import type { WhackEffect } from './weapons/WeedWhacker';
import type { Camera } from '../engine/Camera';

export interface DamageNumber {
  x: number; y: number;
  amount: number;
  isCrit: boolean;
  spawnTime: number;
  lifetime: number;
}

export interface WorldConfig {
  playerStats: PlayerStats;
  unlockedWeaponIds: string[];
  startingWeaponId: string;
  characterId: string;
}

const RUN_DURATION = 30 * 60; // 30 minutes in seconds
const HEALTH_DROP_CHANCE = 0.04; // per enemy kill
const BASE_CHEST_CHANCE = 0.006; // per enemy kill, before Lucky Clover

export class World {
  player: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  xpGems: XPGem[] = [];
  goldCoins: GoldCoin[] = [];
  healthDrops: HealthDrop[] = [];
  chests: TreasureChest[] = [];
  obstacles: Obstacle[] = [];
  damageNumbers: DamageNumber[] = [];

  /** Set by CollisionSystem when the player overlaps a chest this frame (not yet consumed). */
  touchedChest: TreasureChest | null = null;

  // Visual-only effect lists
  vineWhipEffects: VineWhipEffect[] = [];
  sprayEffects: SprayEffect[] = [];
  whackEffects: WhackEffect[] = [];
  orbitalPositions: OrbitalPosition[] = []; // updated by WateringOrb every tick

  particles = new ParticleSystem();

  elapsed = 0;       // seconds into the run
  score = 0;
  killCount = 0;

  private wave = new WaveSystem();
  private collision = new CollisionSystem();
  private ai = new EnemyAISystem();
  private obstacleSystem = new ObstacleSystem();

  unlockedWeaponIds: string[];
  characterId: string;

  /** Called when a level-up should trigger. Game.ts sets this. */
  onLevelUp?: () => void;

  /** Called when a treasure chest is opened. Game.ts sets this. */
  onChestOpen?: (reward: ChestReward) => void;

  constructor(config: WorldConfig) {
    this.player = new Player(0, 0, config.playerStats);
    const starter = createWeapon(config.startingWeaponId as WeaponId);
    applyPerkToWeapon(starter, this.player);
    this.player.weapons.push(starter);
    this.unlockedWeaponIds = config.unlockedWeaponIds;
    this.characterId = config.characterId;
  }

  get weapons(): Weapon[] { return this.player.weapons; }

  update(dt: number, camera: Camera, moveX: number, moveY: number): void {
    if (!this.player.alive) return;

    this.elapsed += dt;

    // Player movement
    this.player.update(dt, moveX, moveY);

    // Camera follows player (update here so collision can use camera bounds)
    camera.follow(this.player.x, this.player.y, dt);
    camera.update(dt);

    // Weapon ticks
    for (const weapon of this.player.weapons) {
      weapon.tick(dt, this, this.player);
    }

    // Enemy AI
    this.ai.update(this.enemies, this.player, dt);

    // Enemy movement
    for (const enemy of this.enemies) enemy.update(dt);

    // Projectile movement
    for (const proj of this.projectiles) {
      if (!proj.alive) continue;
      proj.update(dt);
      // AoE projectiles explode when they expire
      if (!proj.alive && proj.isAoe) this.explodeAoe(proj);
    }

    // XP gems / gold coins / pickups movement
    for (const gem of this.xpGems)   gem.update(dt);
    for (const coin of this.goldCoins) coin.update(dt);
    for (const drop of this.healthDrops) drop.update(dt);
    for (const chest of this.chests) chest.update(dt);

    // Collisions (clears + may set touchedChest)
    this.touchedChest = null;
    this.collision.update(this, camera);

    // Wave spawning
    const newEnemies = this.wave.update(dt, this.elapsed, this.player, camera);
    this.enemies.push(...newEnemies);

    // Obstacles: maintain the field, animate, and resolve blocking collisions
    this.obstacles = this.obstacleSystem.update(dt, this.obstacles, this.player, camera);
    for (const o of this.obstacles) o.update(dt);
    this.resolveObstacleCollisions();

    // Particles
    this.particles.update(dt);

    // Damage number TTL
    const now = performance.now() / 1000;
    this.damageNumbers = this.damageNumbers.filter(dn => now - dn.spawnTime < dn.lifetime);

    // Visual effects decay
    for (const vfx of this.vineWhipEffects) vfx.life -= dt * 3.2; // ~0.31s so the reach reads
    this.vineWhipEffects = this.vineWhipEffects.filter(v => v.life > 0);
    for (const s of this.sprayEffects) s.life -= dt * 4;
    this.sprayEffects = this.sprayEffects.filter(s => s.life > 0);
    for (const w of this.whackEffects) w.life -= dt * 5;
    this.whackEffects = this.whackEffects.filter(w => w.life > 0);

    // Revive VFX (fired once on the frame Second Wind triggers)
    if (this.player.justRevived) {
      this.player.justRevived = false;
      this.particles.spawnLevelUp(this.player.x, this.player.y);
      camera.shake(12);
    }

    // Pause events: a level-up takes priority; otherwise an opened chest.
    // (If both happen the same frame, the chest stays for next frame.)
    if (this.player.checkLevelUp()) {
      this.onLevelUp?.();
    } else if (this.touchedChest) {
      this.openChest(this.touchedChest);
    }

    // Prune dead entities (keep arrays small)
    if (this.elapsed % 2 < dt) this.pruneDeadEntities();
  }

  private openChest(chest: TreasureChest): void {
    chest.alive = false;
    const options = buildLevelUpOptions(this.player, this.player.weapons, this.unlockedWeaponIds);
    const upgrade = options[Math.floor(Math.random() * options.length)];
    const gold = 10 + Math.floor(Math.random() * 41); // 10–50
    this.onChestOpen?.({ gold, upgrade });
  }

  /** Push the player and enemies out of any solid obstacle they overlap. */
  private resolveObstacleCollisions(): void {
    if (this.obstacles.length === 0) return;
    for (const o of this.obstacles) {
      this.pushOut(this.player, o);
      for (const e of this.enemies) {
        if (e.alive) this.pushOut(e, o);
      }
    }
  }

  private pushOut(ent: Entity, o: Obstacle): void {
    const dx = ent.x - o.x;
    const dy = ent.y - o.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const min = ent.radius + o.radius;
    if (dist >= min) return;
    if (dist > 0.0001) {
      const push = min - dist;
      ent.x += (dx / dist) * push;
      ent.y += (dy / dist) * push;
    } else {
      ent.x += min; // degenerate: exactly overlapping centers
    }
  }

  /** Spawn loot when a destructible obstacle is broken. Called from CollisionSystem. */
  onObstacleDestroyed(o: Obstacle): void {
    const [r, g, b] = o.type === 'crate' ? [180, 130, 60] : [70, 150, 50];
    this.particles.spawnDeath(o.x, o.y, r, g, b, 12);
    if (o.type === 'crate') {
      this.goldCoins.push(new GoldCoin(o.x, o.y, 3 + Math.floor(Math.random() * 4)));
    } else {
      this.xpGems.push(new XPGem(o.x, o.y, 5));
    }
    if (Math.random() < 0.35) {
      this.healthDrops.push(new HealthDrop(o.x, o.y, 20));
    }
  }

  private pruneDeadEntities(): void {
    this.enemies    = this.enemies.filter(e => e.alive);
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.xpGems     = this.xpGems.filter(g => g.alive);
    this.goldCoins  = this.goldCoins.filter(c => c.alive);
    this.healthDrops = this.healthDrops.filter(d => d.alive);
    this.chests     = this.chests.filter(c => c.alive);
  }

  private explodeAoe(proj: Projectile): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - proj.x;
      const dy = enemy.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < proj.aoeRadius + enemy.radius) {
        const { amount, isCrit } = this.player.rollHit(proj.damage);
        enemy.takeDamage(amount);
        // Blast knockback radiates outward from the explosion center
        if (proj.knockback > 0 && dist > 0) {
          enemy.applyKnockback(dx / dist, dy / dist, proj.knockback);
        }
        this.particles.spawnHit(enemy.x, enemy.y, isCrit ? 9 : 5);
        if (!enemy.alive) this.onEnemyKilled(enemy);
        else if (isCrit) this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, amount, true);
      }
    }
    this.particles.spawnDeath(proj.x, proj.y, 120, 80, 30, 15);
  }

  onEnemyKilled(enemy: Enemy): void {
    this.killCount++;
    this.score += enemy.scoreValue;

    // Lifesteal on kill
    if (this.player.stats.lifesteal > 0) this.player.heal(this.player.stats.lifesteal);

    // Health drop (uncommon)
    if (Math.random() < HEALTH_DROP_CHANCE) {
      this.healthDrops.push(new HealthDrop(enemy.x, enemy.y, 15 + Math.round(enemy.maxHp / 12)));
    }

    // Treasure chest (rare, boosted by Lucky Clover)
    if (Math.random() < BASE_CHEST_CHANCE + this.player.stats.chestLuck) {
      this.chests.push(new TreasureChest(enemy.x, enemy.y));
    }

    // XP drops
    const gemCount = enemy.xpValue >= 5 ? 1 : Math.ceil(Math.random() * 2);
    for (let i = 0; i < gemCount; i++) {
      const gem = new XPGem(
        enemy.x + (Math.random() - 0.5) * 20,
        enemy.y + (Math.random() - 0.5) * 20,
        Math.max(1, Math.round(enemy.xpValue / gemCount)),
      );
      this.xpGems.push(gem);
    }

    // Gold drops
    if (Math.random() < enemy.goldChance) {
      this.goldCoins.push(new GoldCoin(enemy.x, enemy.y, enemy.goldValue));
    }

    // Death particles
    const colors: Record<string, [number, number, number]> = {
      rotSpore:    [100, 60, 20],
      aphid:       [80, 180, 40],
      caterpillar: [60, 140, 40],
      beetle:      [60, 60, 100],
    };
    const [r, g, b] = colors[enemy.type] ?? [120, 120, 120];
    this.particles.spawnDeath(enemy.x, enemy.y, r, g, b, 10 + Math.round(enemy.maxHp / 10));

    // Damage number
    this.spawnDamageNumber(enemy.x, enemy.y - enemy.radius, enemy.maxHp, false);
  }

  spawnDamageNumber(x: number, y: number, amount: number, isCrit: boolean): void {
    this.damageNumbers.push({
      x, y, amount, isCrit,
      spawnTime: performance.now() / 1000,
      lifetime: 0.8,
    });
  }

  get isVictory(): boolean {
    return this.elapsed >= RUN_DURATION;
  }

  get timeRemaining(): number {
    return Math.max(0, RUN_DURATION - this.elapsed);
  }
}
