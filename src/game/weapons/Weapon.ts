import type { Player } from '../entities/Player';
import type { World } from '../World';

export interface WeaponLevelConfig {
  damage: number;
  cooldown: number;    // seconds between fires
  count: number;       // projectiles per burst
  speed: number;       // projectile speed
  pierce: number;      // piercing count
  area: number;        // AoE radius multiplier or melee range
  duration: number;    // projectile lifetime multiplier
  description: string; // shown on the level-up card
}

export abstract class Weapon {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly icon: string; // emoji fallback icon for HUD

  level = 1;
  maxLevel = 8;
  /** Number of stacked copies. Multiplies the weapon's projectile count. */
  stacks = 1;
  maxStacks = 5;
  cooldownTimer = 0;

  /** Flat extra projectiles from a character perk (e.g. Garlic's Clove Barrage). */
  bonusCount = 0;
  /** Area multiplier from a character perk (e.g. Cherry's Blast Radius). */
  areaMult = 1;
  /** Base knockback force applied to enemies on hit. Overridden per weapon. */
  knockback = 40;

  abstract levelConfigs: WeaponLevelConfig[];

  get config(): WeaponLevelConfig {
    const base = this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
    // Stacks multiply, perk bonusCount adds; perk areaMult scales AoE/melee range.
    const count = (base.count + this.bonusCount) * this.stacks;
    if (count === base.count && this.areaMult === 1) return base;
    return { ...base, count, area: base.area * this.areaMult };
  }

  /** Called each fixed update tick. Returns true if weapon fired. */
  tick(dt: number, world: World, player: Player): boolean {
    this.cooldownTimer -= dt;
    if (this.cooldownTimer <= 0) {
      this.fire(world, player);
      this.cooldownTimer = this.config.cooldown * player.stats.cooldownMult;
      return true;
    }
    return false;
  }

  protected abstract fire(world: World, player: Player): void;

  levelUp(): void {
    if (this.level < this.maxLevel) this.level++;
  }

  addStack(): void {
    if (this.stacks < this.maxStacks) this.stacks++;
  }
}
