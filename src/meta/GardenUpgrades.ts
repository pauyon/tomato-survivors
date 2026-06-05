export interface GardenUpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  maxLevel: number;
  costAtLevel: (level: number) => number;
  /** Returns the stat modifier at a given level. */
  modifier: (level: number) => Partial<{
    maxHpMultiplier: number;
    speedMultiplier: number;
    damageMultiplier: number;
    xpMultiplier: number;
    goldMultiplier: number;
    magnetRadius: number;
    armor: number;
    critChance: number;
    cooldownMult: number;
    lifesteal: number;
    chestLuck: number;
    revives: number;
  }>;
}

export const GARDEN_UPGRADE_DEFS: GardenUpgradeDef[] = [
  {
    id: 'max_hp',
    name: 'Bigger Tomato',
    desc: '+5% max HP per level',
    icon: '🍅',
    maxLevel: 10,
    costAtLevel: (l) => 10 + l * 8,
    modifier: (l) => ({ maxHpMultiplier: 1 + l * 0.05 }),
  },
  {
    id: 'move_speed',
    name: 'Vine Legs',
    desc: '+3% move speed per level',
    icon: '🌿',
    maxLevel: 10,
    costAtLevel: (l) => 12 + l * 10,
    modifier: (l) => ({ speedMultiplier: 1 + l * 0.03 }),
  },
  {
    id: 'damage',
    name: 'Bitter Taste',
    desc: '+5% damage per level',
    icon: '💪',
    maxLevel: 10,
    costAtLevel: (l) => 12 + l * 10,
    modifier: (l) => ({ damageMultiplier: 1 + l * 0.05 }),
  },
  {
    id: 'xp_gain',
    name: 'Photosynthesis',
    desc: '+10% XP gained per level',
    icon: '⭐',
    maxLevel: 5,
    costAtLevel: (l) => 15 + l * 15,
    modifier: (l) => ({ xpMultiplier: 1 + l * 0.10 }),
  },
  {
    id: 'gold_gain',
    name: 'Bumper Crop',
    desc: '+10% gold drops per level',
    icon: '💰',
    maxLevel: 5,
    costAtLevel: (l) => 15 + l * 15,
    modifier: (l) => ({ goldMultiplier: 1 + l * 0.10 }),
  },
  {
    id: 'magnet',
    name: 'Sticky Vines',
    desc: '+20 XP magnet radius per level',
    icon: '🧲',
    maxLevel: 5,
    costAtLevel: (l) => 10 + l * 10,
    modifier: (l) => ({ magnetRadius: l * 20 }),
  },
  {
    id: 'armor',
    name: 'Tough Skin',
    desc: '+1 flat damage reduction per level',
    icon: '🛡️',
    maxLevel: 5,
    costAtLevel: (l) => 20 + l * 15,
    modifier: (l) => ({ armor: l }),
  },
  // Combat passives (replace the old weapon-unlock slots — all weapons are now
  // always available as in-run level-up rewards).
  {
    id: 'second_wind',
    name: 'Second Wind',
    desc: 'Revive once per run at 50% HP',
    icon: '💚',
    maxLevel: 1,
    costAtLevel: () => 50,
    modifier: () => ({ revives: 1 }),
  },
  {
    id: 'quick_harvest',
    name: 'Quick Harvest',
    desc: '-4% weapon cooldown per level',
    icon: '⚡',
    maxLevel: 5,
    costAtLevel: (l) => 20 + l * 18,
    modifier: (l) => ({ cooldownMult: 1 - l * 0.04 }),
  },
  {
    id: 'sharp_thorns',
    name: 'Sharp Thorns',
    desc: '+4% critical hit chance per level',
    icon: '🎯',
    maxLevel: 5,
    costAtLevel: (l) => 20 + l * 18,
    modifier: (l) => ({ critChance: l * 0.04 }),
  },
  {
    id: 'vampiric_roots',
    name: 'Vampiric Roots',
    desc: 'Heal +1 HP per kill, per level',
    icon: '🧛',
    maxLevel: 5,
    costAtLevel: (l) => 25 + l * 20,
    modifier: (l) => ({ lifesteal: l }),
  },
  {
    id: 'lucky_clover',
    name: 'Lucky Clover',
    desc: '+1% treasure chest drop chance per level',
    icon: '🍀',
    maxLevel: 5,
    costAtLevel: (l) => 18 + l * 15,
    modifier: (l) => ({ chestLuck: l * 0.01 }),
  },
];
