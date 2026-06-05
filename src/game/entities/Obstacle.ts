import { Entity } from './Entity';

export type ObstacleType = 'rock' | 'crate' | 'bush';

interface ObstacleDef {
  radius: number;
  hp: number;
  destructible: boolean;
}

const OBSTACLE_DEFS: Record<ObstacleType, ObstacleDef> = {
  rock:  { radius: 18, hp: Infinity, destructible: false }, // immovable wall
  crate: { radius: 15, hp: 40,  destructible: true },
  bush:  { radius: 14, hp: 22,  destructible: true },
};

/** A static field prop. Rocks block movement; crates/bushes are destructible and drop loot. */
export class Obstacle extends Entity {
  type: ObstacleType;
  hp: number;
  maxHp: number;
  destructible: boolean;
  hitFlash = 0;

  constructor(x: number, y: number, type: ObstacleType) {
    const def = OBSTACLE_DEFS[type];
    super(x, y, def.radius);
    this.type = type;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.destructible = def.destructible;
  }

  takeDamage(amount: number): void {
    if (!this.destructible) return;
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  update(dt: number): void {
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  get hpFraction(): number {
    return this.maxHp === Infinity ? 1 : this.hp / this.maxHp;
  }
}

export function randomObstacleType(): ObstacleType {
  const r = Math.random();
  if (r < 0.4) return 'rock';
  if (r < 0.72) return 'crate';
  return 'bush';
}
