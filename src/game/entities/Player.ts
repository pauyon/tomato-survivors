import { Entity } from './Entity';
import type { Weapon } from '../weapons/Weapon';

export interface PlayerStats {
  maxHp: number;
  speed: number;            // pixels per second
  damageMultiplier: number; // 1.0 = 100%
  xpMultiplier: number;
  goldMultiplier: number;
  magnetRadius: number;     // XP auto-collect radius
  armor: number;            // flat damage reduction

  // Combat extras (Garden passives + character perks feed these)
  critChance: number;       // 0–1 probability of a critical hit
  critMultiplier: number;   // damage multiplier on crit (e.g. 2.0)
  cooldownMult: number;     // weapon cooldown multiplier (<1 = faster)
  lifesteal: number;        // HP healed per enemy kill
  chestLuck: number;        // added to base treasure-chest drop chance
  revives: number;          // one-time revives remaining this run
  bonusProjectiles: number; // flat +projectiles added to every weapon
  areaMult: number;         // multiplier on weapon area / AoE
}

/** Default values for the combat-extra stats, so callers can spread a base. */
export const DEFAULT_COMBAT_STATS = {
  critChance: 0,
  critMultiplier: 2.0,
  cooldownMult: 1.0,
  lifesteal: 0,
  chestLuck: 0,
  revives: 0,
  bonusProjectiles: 0,
  areaMult: 1.0,
} satisfies Partial<PlayerStats>;

export class Player extends Entity {
  hp: number;
  stats: PlayerStats;

  // Visual state
  facingRight = true;
  animFrame = 0;
  animTime = 0;
  state: 'idle' | 'walk' | 'hurt' = 'idle';

  // Invincibility frames after taking damage
  iframes = 0;
  readonly iframeDuration = 0.6; // seconds

  // Set true on the frame a revive triggers, so World can play VFX. World clears it.
  justRevived = false;

  // XP and leveling
  xp = 0;
  level = 1;
  xpToNextLevel = 10;

  // Gold (meta-currency)
  gold = 0;

  // Weapons (max 6 slots)
  weapons: Weapon[] = [];

  // Kill count for this run
  kills = 0;

  constructor(x: number, y: number, stats: PlayerStats) {
    super(x, y, 18); // hitbox scaled up to match the 2× (64px) sprite
    this.stats = { ...stats };
    this.hp = stats.maxHp;
  }

  get isInvincible(): boolean {
    return this.iframes > 0;
  }

  takeDamage(amount: number): void {
    if (this.iframes > 0) return;
    const reduced = Math.max(1, amount - this.stats.armor);
    this.hp = Math.max(0, this.hp - reduced);
    this.iframes = this.iframeDuration;
    this.state = 'hurt';
    if (this.hp <= 0) {
      if (this.stats.revives > 0) {
        // Second Wind: revive once at 50% HP with a long invuln window.
        this.stats.revives--;
        this.hp = Math.round(this.stats.maxHp * 0.5);
        this.iframes = 1.5;
        this.justRevived = true;
      } else {
        this.alive = false;
      }
    }
  }

  heal(amount: number): void {
    if (amount <= 0) return;
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  /** Roll a single hit's damage, applying crit chance. Reused at every damage site. */
  rollHit(base: number): { amount: number; isCrit: boolean } {
    const isCrit = Math.random() < this.stats.critChance;
    const amount = Math.round(isCrit ? base * this.stats.critMultiplier : base);
    return { amount, isCrit };
  }

  addXP(amount: number): void {
    this.xp += Math.round(amount * this.stats.xpMultiplier);
  }

  addGold(amount: number): void {
    this.gold += Math.round(amount * this.stats.goldMultiplier);
  }

  /** Returns true if player leveled up. */
  checkLevelUp(): boolean {
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      // XP curve: each level needs ~20% more XP than the previous
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.2);
      return true;
    }
    return false;
  }

  update(dt: number, moveX: number, moveY: number): void {
    this.savePrev();

    // Invincibility frame countdown
    if (this.iframes > 0) {
      this.iframes -= dt;
      if (this.iframes <= 0) {
        this.iframes = 0;
        this.state = 'idle';
      }
    }

    // Movement
    const moving = moveX !== 0 || moveY !== 0;
    this.vx = moveX * this.stats.speed;
    this.vy = moveY * this.stats.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (moving) {
      if (moveX > 0) this.facingRight = true;
      if (moveX < 0) this.facingRight = false;
      if (this.state !== 'hurt') this.state = 'walk';
    } else {
      if (this.state !== 'hurt') this.state = 'idle';
    }

    // Animation
    const fps = this.state === 'walk' ? 8 : 4;
    this.animTime += dt;
    this.animFrame = Math.floor(this.animTime * fps) % 4;
  }
}
