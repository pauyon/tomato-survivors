import type { Player } from '../entities/Player';
import type { Weapon } from '../weapons/Weapon';
import { createWeapon, applyPerkToWeapon, WEAPON_META, type WeaponId } from '../weapons/WeaponRegistry';

export type UpgradeType = 'weapon_levelup' | 'weapon_stack' | 'new_weapon' | 'passive';

export interface Upgrade {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  icon: string;
  /** Apply this upgrade to the player / weapon list. */
  apply: (player: Player, weapons: Weapon[]) => void;
}

/** How many times a passive can be taken before it drops out of the pool (VS-style). */
export const PASSIVE_MAX_LEVEL = 5;

interface PassiveDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Per-pick stat effect (called once each time the passive is chosen). */
  effect: (player: Player) => void;
  /** Optional override for the per-passive cap. Defaults to PASSIVE_MAX_LEVEL. */
  maxLevel?: number;
}

/** A treasure-chest reward: some gold plus one random upgrade (chosen like a level-up). */
export interface ChestReward {
  gold: number;
  upgrade: Upgrade;
}

const PASSIVE_DEFS: PassiveDef[] = [
  {
    id: 'hp_up',
    name: 'Vitamin C Boost',
    description: '+20% max HP. Also restores 20 HP.',
    icon: '❤️',
    effect: (player) => {
      player.stats.maxHp = Math.round(player.stats.maxHp * 1.2);
      player.heal(20);
    },
  },
  {
    id: 'speed_up',
    name: 'Sugar Rush',
    description: '+12% move speed.',
    icon: '👟',
    effect: (player) => { player.stats.speed *= 1.12; },
  },
  {
    id: 'damage_up',
    name: 'Bitter Taste',
    description: '+15% damage to all weapons.',
    icon: '💪',
    effect: (player) => { player.stats.damageMultiplier *= 1.15; },
  },
  {
    id: 'xp_up',
    name: 'Photosynthesis',
    description: '+20% XP gained.',
    icon: '⭐',
    effect: (player) => { player.stats.xpMultiplier *= 1.2; },
  },
  {
    id: 'magnet_up',
    name: 'Magnetic Vines',
    description: '+40 XP magnet radius.',
    icon: '🧲',
    effect: (player) => { player.stats.magnetRadius += 40; },
  },
  {
    id: 'armor_up',
    name: 'Tough Skin',
    description: '+3 armor (flat damage reduction).',
    icon: '🛡️',
    effect: (player) => { player.stats.armor += 3; },
  },
  {
    id: 'gold_up',
    name: 'Golden Harvest',
    description: '+20% gold drops.',
    icon: '💰',
    effect: (player) => { player.stats.goldMultiplier *= 1.2; },
  },
  // --- "Projectile / utility" axes, à la Vampire Survivors passive items. These
  //     are global modifiers kept distinct from per-weapon level damage. ---
  {
    id: 'amount_up',
    name: 'Bountiful Harvest',
    description: '+1 projectile to every weapon.',
    icon: '🍅',
    maxLevel: 2, // very strong: each level adds a projectile to ALL weapons
    effect: (player) => {
      player.stats.bonusProjectiles += 1;
      for (const w of player.weapons) applyPerkToWeapon(w, player);
    },
  },
  {
    id: 'cooldown_up',
    name: 'Quick Hands',
    description: '-8% weapon cooldown (attack faster).',
    icon: '⏱️',
    effect: (player) => { player.stats.cooldownMult *= 0.92; },
  },
  {
    id: 'area_up',
    name: 'Sprawling Roots',
    description: '+12% weapon area & blast size.',
    icon: '🌾',
    effect: (player) => {
      player.stats.areaMult *= 1.12;
      for (const w of player.weapons) applyPerkToWeapon(w, player);
    },
  },
];

/** id → display info + cap for passives the player holds (used by the HUD inventory). */
export const PASSIVE_INFO: Record<string, { name: string; icon: string; maxLevel: number }> =
  Object.fromEntries(PASSIVE_DEFS.map(d => [d.id, { name: d.name, icon: d.icon, maxLevel: d.maxLevel ?? PASSIVE_MAX_LEVEL }]));

const passiveMaxLevel = (def: PassiveDef): number => def.maxLevel ?? PASSIVE_MAX_LEVEL;

/** Current level of a passive (0 if never taken). */
function passiveLevel(player: Player, id: string): number {
  return player.passiveLevels[id] ?? 0;
}

/** Build a level-up card for a passive, tagging the running X/max level and
 *  recording the pick so the passive eventually caps out. */
function passiveUpgrade(def: PassiveDef, player: Player): Upgrade {
  const next = passiveLevel(player, def.id) + 1;
  return {
    id: def.id,
    type: 'passive',
    name: def.name,
    description: `${def.description}  (Lv ${next}/${passiveMaxLevel(def)})`,
    icon: def.icon,
    apply: (p) => {
      def.effect(p);
      p.passiveLevels[def.id] = passiveLevel(p, def.id) + 1;
    },
  };
}

/**
 * Filler rewards shown only once the real pool (weapons + un-capped passives) can't
 * fill three cards. Mirrors Vampire Survivors handing out chicken / coins when every
 * item is maxed, so a level-up is never a dead card.
 */
const FALLBACK_UPGRADES: Upgrade[] = [
  {
    id: 'fallback_chicken',
    type: 'passive',
    name: 'Roast Chicken',
    description: 'Restores 30% of max HP.',
    icon: '🍗',
    apply: (player) => { player.heal(Math.round(player.stats.maxHp * 0.3)); },
  },
  {
    id: 'fallback_gold',
    type: 'passive',
    name: 'Coin Pouch',
    description: '+30 gold.',
    icon: '💰',
    apply: (player) => { player.addGold(30); },
  },
  {
    id: 'fallback_gold_big',
    type: 'passive',
    name: 'Coin Sack',
    description: '+60 gold.',
    icon: '🪙',
    apply: (player) => { player.addGold(60); },
  },
];

/**
 * Build upgrade options to show on level-up. Picks 3 unique options.
 * `_unlockedWeaponIds` is retained for call-site compatibility but no longer gates the
 * in-run pool: any character can pick up and run any weapon alongside its starter.
 */
export function buildLevelUpOptions(player: Player, weapons: Weapon[], _unlockedWeaponIds: string[]): Upgrade[] {
  const options: Upgrade[] = [];

  // 1. Weapon level-ups (existing weapons)
  for (const weapon of weapons) {
    if (weapon.level < weapon.maxLevel) {
      const nextConfig = weapon.levelConfigs[Math.min(weapon.level, weapon.levelConfigs.length - 1)];
      options.push({
        id: `levelup_${weapon.id}`,
        type: 'weapon_levelup',
        name: weapon.name,
        description: nextConfig.description,
        icon: weapon.icon,
        apply: (_p, ws) => { ws.find(w => w.id === weapon.id)?.levelUp(); },
      });
    }
  }

  // 2. Weapon stacks (owned weapons → extra copy of their output). Bypasses the
  //    weapon-slot cap since stacks multiply an existing weapon rather than adding a slot.
  for (const weapon of weapons) {
    if (weapon.stacks < weapon.maxStacks) {
      options.push({
        id: `stack_${weapon.id}`,
        type: 'weapon_stack',
        name: weapon.name,
        description: 'Adds an extra burst of projectiles.',
        icon: weapon.icon,
        apply: (_p, ws) => { ws.find(w => w.id === weapon.id)?.addStack(); },
      });
    }
  }

  // 3. New weapons — the full roster, minus what's already held, while there's a free slot.
  //    Not gated by meta unlocks, so e.g. Tommy (Seed Shot) can add a Vine Whip and run both.
  const MAX_WEAPONS = 6;
  if (weapons.length < MAX_WEAPONS) {
    for (const wId of Object.keys(WEAPON_META) as WeaponId[]) {
      if (!weapons.find(w => w.id === wId)) {
        const meta = WEAPON_META[wId];
        options.push({
          id: `new_${wId}`,
          type: 'new_weapon',
          name: meta.name,
          description: meta.description,
          icon: meta.icon,
          apply: (p, ws) => { const w = createWeapon(wId); applyPerkToWeapon(w, p); ws.push(w); },
        });
      }
    }
  }

  // 4. Passive upgrades — only those that haven't hit their cap. Once a passive is
  //    maxed it drops out of the pool, so stats can't compound forever.
  for (const def of PASSIVE_DEFS) {
    if (passiveLevel(player, def.id) < passiveMaxLevel(def)) {
      options.push(passiveUpgrade(def, player));
    }
  }

  // Shuffle the real pool and take up to 3 unique offers.
  const shuffled = options.sort(() => Math.random() - 0.5).slice(0, 3);

  // Pad to 3 with fallback rewards (chicken / coins) when everything else is maxed,
  // so a level-up is never an empty screen.
  if (shuffled.length < 3) {
    const fillers = [...FALLBACK_UPGRADES].sort(() => Math.random() - 0.5);
    let i = 0;
    while (shuffled.length < 3) {
      shuffled.push(fillers[i % fillers.length]);
      i++;
    }
  }
  return shuffled;
}
