import type { WeaponId } from '../weapons/WeaponRegistry';
import type { PlayerStats } from '../entities/Player';
import tommySheet from '../../assets/tommy.png';
import daybreakSheet from '../../assets/daybreak.png';

export interface StatModifier {
  maxHpMult?: number;
  speedMult?: number;
  damageMult?: number;
  xpMult?: number;
  goldMult?: number;
  magnetBonus?: number;
  armorBonus?: number;
  // Perk-driven combat modifiers
  bonusProjectiles?: number; // flat +projectiles to every weapon
  cooldownMult?: number;     // <1 = faster weapons
  critChanceBonus?: number;  // added crit chance
  areaMult?: number;         // multiplier on weapon area / AoE
}

export interface CharacterPerk {
  name: string;
  description: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;           // portrait fallback when no sprite sheet is set
  /** Optional horizontal sprite sheet; frame 0 is used as the portrait. */
  portraitSheet?: string;
  color: string;           // primary color for card accent
  startingWeapon: WeaponId;
  statModifiers: StatModifier;
  statTags: string[];      // short stat lines shown on card e.g. "+20% HP"
  perk: CharacterPerk;     // signature ability that makes the character unique
  unlockCost: number;      // meta-gold cost to unlock (0 = free/starter)
  hidden?: boolean;        // not shown in the character select grid
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'tommy_tomato',
    name: 'Tommy Tomato',
    tagline: 'The Garden Guardian',
    description: 'A bold little tomato defending his home patch. Aggressive and well-rounded.',
    emoji: '🍅',
    portraitSheet: tommySheet,
    color: '#e63333',
    startingWeapon: 'vine_whip',
    statModifiers: { damageMult: 1.15, speedMult: 1.10 },
    statTags: ['+15% Damage', '+10% Speed', 'Vine Whip start'],
    perk: { name: 'Garden Guardian', description: 'Hits harder and moves faster — a balanced all-rounder.' },
    unlockCost: 0,
  },
  {
    id: 'garlic_gary',
    name: 'Garlic Gary',
    tagline: 'The Pungent Protector',
    description: 'A tough old bulb who swings a heavy axe. Slow but hits like a truck.',
    emoji: '🧄',
    color: '#c8b080',
    startingWeapon: 'garden_axe',
    statModifiers: { maxHpMult: 1.35, speedMult: 0.88, damageMult: 1.1, bonusProjectiles: 1 },
    statTags: ['+35% Max HP', '-12% Speed', '+1 Projectile', 'Garden Axe start'],
    perk: { name: 'Clove Barrage', description: 'Every weapon fires +1 extra projectile per burst.' },
    unlockCost: 150,
    hidden: true,
  },
  {
    id: 'pepper_pete',
    name: 'Pepper Pete',
    tagline: 'The Spicy Speedster',
    description: 'A hot pepper with lightning reflexes. Fragile but blindingly fast.',
    emoji: '🌶️',
    color: '#ff6600',
    startingWeapon: 'tomato_knife',
    statModifiers: { speedMult: 1.28, maxHpMult: 0.80, damageMult: 1.15, cooldownMult: 0.75 },
    statTags: ['+28% Speed', '-20% Max HP', '+33% Attack Speed', 'Tomato Knife start'],
    perk: { name: 'Hot Streak', description: 'All weapons fire 33% faster (-25% cooldown).' },
    unlockCost: 250,
    hidden: true,
  },
  {
    id: 'cherry_bomb',
    name: 'Cherry Bomb',
    tagline: 'The Explosive Expert',
    description: 'A volatile little cherry who specialises in splash damage. Handles crowds with ease.',
    emoji: '🍒',
    color: '#cc1144',
    startingWeapon: 'fertilizer_pot',
    statModifiers: { damageMult: 1.25, speedMult: 1.1, maxHpMult: 0.88, areaMult: 1.3 },
    statTags: ['+25% Damage', '+30% Area', '-12% Max HP', 'Fertilizer Pot start'],
    perk: { name: 'Blast Radius', description: 'All weapon areas & explosions are 30% larger.' },
    unlockCost: 350,
    hidden: true,
  },
  {
    id: 'daybreak',
    name: 'Daybreak',
    tagline: 'The Creator',
    description: 'The architect of this world, descended into it. Commands orbiting tides and bends the garden to his will.',
    emoji: '🌀',
    portraitSheet: daybreakSheet,
    color: '#3a6ed0',
    startingWeapon: 'watering_orb',
    statModifiers: { maxHpMult: 1.2, damageMult: 1.2, areaMult: 1.25, bonusProjectiles: 1, xpMult: 1.3 },
    statTags: ['+30% XP', '+1 Projectile', '+25% Area', '+20% HP', '+20% Damage', 'Watering Orb start'],
    perk: { name: 'Photosynthesis', description: 'Draws power from the sun for +30% XP — and the world answers his command: every weapon gains +1 projectile and +25% area.' },
    unlockCost: 777,
  },
];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}

/** Apply character modifiers (including signature perks) on top of base garden stats. */
export function applyCharacterMods(base: PlayerStats, mods: StatModifier): PlayerStats {
  return {
    ...base,
    maxHp:            Math.round(base.maxHp            * (mods.maxHpMult  ?? 1)),
    speed:            base.speed                        * (mods.speedMult  ?? 1),
    damageMultiplier: base.damageMultiplier             * (mods.damageMult ?? 1),
    xpMultiplier:     base.xpMultiplier                * (mods.xpMult     ?? 1),
    goldMultiplier:   base.goldMultiplier               * (mods.goldMult   ?? 1),
    magnetRadius:     base.magnetRadius                 + (mods.magnetBonus ?? 0),
    armor:            base.armor                        + (mods.armorBonus  ?? 0),
    // Perk-driven combat modifiers
    cooldownMult:     base.cooldownMult                 * (mods.cooldownMult    ?? 1),
    critChance:       base.critChance                   + (mods.critChanceBonus ?? 0),
    areaMult:         base.areaMult                     * (mods.areaMult        ?? 1),
    bonusProjectiles: base.bonusProjectiles             + (mods.bonusProjectiles ?? 0),
  };
}
