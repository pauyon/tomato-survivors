import { Entity } from './Entity';

export type EnemyType = 'rotSpore' | 'aphid' | 'caterpillar' | 'beetle';

export interface EnemyDef {
  type: EnemyType;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  goldChance: number; // 0-1 probability of dropping a gold coin
  goldValue: number;
  scoreValue: number;
}

export class Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  goldChance: number;
  goldValue: number;
  scoreValue: number;

  // AI state
  aiTimer = 0;
  chargeTarget: { x: number; y: number } | null = null;
  isCharging = false;
  animTime = 0;

  // Flash on hit
  hitFlash = 0;

  // Elite enemies are tougher and are the main source of treasure chests.
  isElite = false;

  // Knockback impulse — applied on top of AI velocity, decays each frame.
  // Kept separate so the AI's per-frame vx/vy assignment doesn't clobber it.
  kbX = 0;
  kbY = 0;

  constructor(x: number, y: number, def: EnemyDef) {
    super(x, y, def.radius);
    this.type = def.type;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.xpValue = def.xpValue;
    this.goldChance = def.goldChance;
    this.goldValue = def.goldValue;
    this.scoreValue = def.scoreValue;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  /** Push the enemy in a (normalized) direction with the given force. */
  applyKnockback(dirX: number, dirY: number, force: number): void {
    this.kbX += dirX * force;
    this.kbY += dirY * force;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    this.x += (this.vx + this.kbX) * dt;
    this.y += (this.vy + this.kbY) * dt;
    // Decay knockback (frame-rate independent)
    const decay = Math.pow(0.82, dt * 60);
    this.kbX *= decay;
    this.kbY *= decay;
    if (Math.abs(this.kbX) < 1) this.kbX = 0;
    if (Math.abs(this.kbY) < 1) this.kbY = 0;
  }

  get hpFraction(): number {
    return this.hp / this.maxHp;
  }
}
