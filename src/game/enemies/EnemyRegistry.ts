import type { EnemyDef, EnemyType } from '../entities/Enemy';

export const BASE_ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  rotSpore: {
    type: 'rotSpore',
    hp: 28,
    speed: 55,
    damage: 15,
    radius: 13,
    xpValue: 3,
    goldChance: 0.08,
    goldValue: 1,
    scoreValue: 10,
  },
  aphid: {
    type: 'aphid',
    hp: 10,
    speed: 100,
    damage: 8,
    radius: 8,
    xpValue: 1,
    goldChance: 0.05,
    goldValue: 1,
    scoreValue: 5,
  },
  caterpillar: {
    type: 'caterpillar',
    hp: 55,
    speed: 45,
    damage: 18,
    radius: 14,
    xpValue: 6,
    goldChance: 0.15,
    goldValue: 2,
    scoreValue: 20,
  },
  beetle: {
    type: 'beetle',
    hp: 120,
    speed: 35,
    damage: 25,
    radius: 16,
    xpValue: 12,
    goldChance: 0.25,
    goldValue: 3,
    scoreValue: 40,
  },
};

export interface SpawnEntry {
  type: EnemyType;
  /** Minutes from run start when this enemy type begins spawning. */
  unlockTime: number;
  /** Relative spawn weight — higher = more common. */
  weight: number;
}

export const SPAWN_TABLE: SpawnEntry[] = [
  { type: 'rotSpore',    unlockTime: 0,   weight: 4 },
  { type: 'aphid',       unlockTime: 0,   weight: 5 },
  { type: 'caterpillar', unlockTime: 2,   weight: 2 },
  { type: 'beetle',      unlockTime: 5,   weight: 1 },
];

/** Scale enemy stats by elapsed time to increase difficulty. */
export function scaledDef(type: EnemyType, elapsed: number, difficultyBonus = 0): EnemyDef {
  const base = BASE_ENEMY_DEFS[type];
  const hpScale  = 1 + elapsed / 180 + difficultyBonus * 0.1; // doubles over 3 minutes baseline
  const dmgScale = 1 + elapsed / 300;
  return {
    ...base,
    hp:     Math.round(base.hp    * hpScale),
    damage: Math.round(base.damage * dmgScale),
    speed:  base.speed * (1 + elapsed / 600 * 0.3),
  };
}

/** Pick a random enemy type from the spawn table, filtered by elapsed time (seconds). */
export function pickEnemyType(elapsed: number): EnemyType {
  const available = SPAWN_TABLE.filter(e => elapsed >= e.unlockTime * 60);
  const totalWeight = available.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const entry of available) {
    r -= entry.weight;
    if (r <= 0) return entry.type;
  }
  return available[available.length - 1].type;
}
