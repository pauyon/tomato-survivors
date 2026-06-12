import { Entity } from './Entity';

export type ProjectileType = 'seed' | 'vineArc' | 'compostBlast' | 'pesticide' | 'axe' | 'fertPot' | 'knife' | 'tomato';

export class Projectile extends Entity {
  type: ProjectileType;
  damage: number;
  lifetime: number;       // seconds remaining
  maxLifetime: number;
  piercing: number;       // how many enemies it can pass through
  piercedIds = new Set<number>(); // enemy ids already hit

  angle: number;          // direction in radians
  speed: number;

  // For AoE projectiles (compost bomb / fertilizer pot landing zone)
  aoeRadius = 0;
  isAoe = false;

  // Arc / gravity (axes, pots)
  gravity = 0;       // pixels/second² downward acceleration
  spinAngle = 0;     // visual rotation for axes

  // Homing (tomato seekers): steer toward the nearest enemy each frame.
  // Steering is applied by World (which has the enemy list) before update().
  homing = false;
  homingTurnRate = 0; // radians/second the projectile can curve
  homingRange = 0;    // only seek enemies within this distance

  // Knockback force imparted to enemies on hit (set by the firing weapon)
  knockback = 0;

  // Visual
  animTime = 0;

  constructor(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    lifetime: number,
    type: ProjectileType,
    piercing = 1,
    radius = 5,
  ) {
    super(x, y, radius);
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.type = type;
    this.piercing = piercing;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
    if (this.gravity !== 0) this.vy += this.gravity * dt;
    this.spinAngle += dt * 8; // axes / pots spin visually
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Returns 0–1 life remaining fraction. Useful for fade-out effects. */
  get lifeFraction(): number {
    return Math.max(0, this.lifetime / this.maxLifetime);
  }
}
