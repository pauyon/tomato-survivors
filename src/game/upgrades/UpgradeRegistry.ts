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

/** A treasure-chest reward: some gold plus one random upgrade (chosen like a level-up). */
export interface ChestReward {
  gold: number;
  upgrade: Upgrade;
}

export const PASSIVE_UPGRADES: Upgrade[] = [
  {
    id: 'hp_up',
    type: 'passive',
    name: 'Vitamin C Boost',
    description: '+20% max HP. Also restores 20 HP.',
    icon: '❤️',
    apply: (player) => {
      player.stats.maxHp = Math.round(player.stats.maxHp * 1.2);
      player.heal(20);
    },
  },
  {
    id: 'speed_up',
    type: 'passive',
    name: 'Sugar Rush',
    description: '+12% move speed.',
    icon: '👟',
    apply: (player) => { player.stats.speed *= 1.12; },
  },
  {
    id: 'damage_up',
    type: 'passive',
    name: 'Bitter Taste',
    description: '+15% damage to all weapons.',
    icon: '💪',
    apply: (player) => { player.stats.damageMultiplier *= 1.15; },
  },
  {
    id: 'xp_up',
    type: 'passive',
    name: 'Photosynthesis',
    description: '+20% XP gained.',
    icon: '⭐',
    apply: (player) => { player.stats.xpMultiplier *= 1.2; },
  },
  {
    id: 'magnet_up',
    type: 'passive',
    name: 'Magnetic Vines',
    description: '+40 XP magnet radius.',
    icon: '🧲',
    apply: (player) => { player.stats.magnetRadius += 40; },
  },
  {
    id: 'armor_up',
    type: 'passive',
    name: 'Tough Skin',
    description: '+3 armor (flat damage reduction).',
    icon: '🛡️',
    apply: (player) => { player.stats.armor += 3; },
  },
  {
    id: 'gold_up',
    type: 'passive',
    name: 'Golden Harvest',
    description: '+20% gold drops.',
    icon: '💰',
    apply: (player) => { player.stats.goldMultiplier *= 1.2; },
  },
];

/**
 * Build upgrade options to show on level-up. Picks 3 unique options.
 * `_unlockedWeaponIds` is retained for call-site compatibility but no longer gates the
 * in-run pool: any character can pick up and run any weapon alongside its starter.
 */
export function buildLevelUpOptions(_player: Player, weapons: Weapon[], _unlockedWeaponIds: string[]): Upgrade[] {
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

  // 4. Passive upgrades (always available, but shuffle them)
  const shuffledPassives = [...PASSIVE_UPGRADES].sort(() => Math.random() - 0.5);
  options.push(...shuffledPassives);

  // Shuffle all and return 3
  const shuffled = options.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
