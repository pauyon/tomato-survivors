const SAVE_KEY = 'tomato-survivors-save';
const SAVE_VERSION = 2;

export interface SaveData {
  version: number;
  gold: number;
  gardenLevels: Record<string, number>;
  unlockedWeapons: string[];
  unlockedCharacters: string[];
  selectedCharacterId: string;
  stats: {
    runsCompleted: number;
    bestTime: number;
    totalGoldEarned: number;
    totalKills: number;
  };
}

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  gold: 0,
  gardenLevels: {},
  unlockedWeapons: ['seed_shot'],
  unlockedCharacters: ['tommy_tomato'],
  selectedCharacterId: 'tommy_tomato',
  stats: {
    runsCompleted: 0,
    bestTime: 0,
    totalGoldEarned: 0,
    totalKills: 0,
  },
};

export const SaveManager = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const data = JSON.parse(raw) as SaveData;
      // Migration: if version mismatch, merge with defaults
      if (data.version !== SAVE_VERSION) {
        return { ...DEFAULT_SAVE, ...data, version: SAVE_VERSION };
      }
      return data;
    } catch {
      return { ...DEFAULT_SAVE };
    }
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  },

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  },
};
