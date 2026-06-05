import { create } from 'zustand';
import { SaveManager, type SaveData, DEFAULT_SAVE } from './SaveManager';
import { GARDEN_UPGRADE_DEFS } from './GardenUpgrades';
import { getCharacter, applyCharacterMods } from '../game/characters/CharacterRegistry';
import { DEFAULT_COMBAT_STATS, type PlayerStats } from '../game/entities/Player';

interface MetaState extends SaveData {
  load: () => void;
  purchaseUpgrade: (id: string) => boolean;
  unlockCharacter: (id: string) => boolean;
  selectCharacter: (id: string) => void;
  recordRun: (gold: number, survived: number, kills: number) => void;
  getPlayerStats: (characterId?: string) => PlayerStats;
  getUnlockedWeaponIds: () => string[];
  isCharacterUnlocked: (id: string) => boolean;
}

export const useMetaStore = create<MetaState>((set, get) => ({
  ...DEFAULT_SAVE,

  load() {
    const data = SaveManager.load();
    set(data);
  },

  selectCharacter(id: string) {
    const state = get();
    const newState: Partial<SaveData> = { selectedCharacterId: id };
    set(newState);
    SaveManager.save({ ...state, ...newState } as SaveData);
  },

  purchaseUpgrade(id: string): boolean {
    const state = get();
    const def = GARDEN_UPGRADE_DEFS.find(d => d.id === id);
    if (!def) return false;

    const currentLevel = state.gardenLevels[id] ?? 0;
    if (currentLevel >= def.maxLevel) return false;

    const cost = def.costAtLevel(currentLevel);
    if (state.gold < cost) return false;

    const newLevels = { ...state.gardenLevels, [id]: currentLevel + 1 };

    const newState: Partial<SaveData> = { gold: state.gold - cost, gardenLevels: newLevels };
    set(newState);
    SaveManager.save({ ...state, ...newState } as SaveData);
    return true;
  },

  unlockCharacter(id: string): boolean {
    const state = get();
    if (state.unlockedCharacters.includes(id)) return true;
    const char = getCharacter(id);
    if (state.gold < char.unlockCost) return false;

    const newState: Partial<SaveData> = {
      gold: state.gold - char.unlockCost,
      unlockedCharacters: [...state.unlockedCharacters, id],
    };
    set(newState);
    SaveManager.save({ ...state, ...newState } as SaveData);
    return true;
  },

  recordRun(gold: number, survived: number, kills: number) {
    const state = get();
    const newStats = {
      runsCompleted: state.stats.runsCompleted + 1,
      bestTime: Math.max(state.stats.bestTime, survived),
      totalGoldEarned: state.stats.totalGoldEarned + gold,
      totalKills: state.stats.totalKills + kills,
    };
    const newState: Partial<SaveData> = { gold: state.gold + gold, stats: newStats };
    set(newState);
    SaveManager.save({ ...state, ...newState } as SaveData);
  },

  isCharacterUnlocked(id: string): boolean {
    return get().unlockedCharacters.includes(id);
  },

  getPlayerStats(characterId?: string): PlayerStats {
    const { gardenLevels, selectedCharacterId } = get();

    // Base stats from garden upgrades
    let maxHp = 100, speed = 130, damageMultiplier = 1.0;
    let xpMultiplier = 1.0, goldMultiplier = 1.0, magnetRadius = 80, armor = 0;
    // Combat extras
    let critChance = 0, cooldownMult = 1.0, lifesteal = 0, chestLuck = 0, revives = 0;

    for (const def of GARDEN_UPGRADE_DEFS) {
      const level = gardenLevels[def.id] ?? 0;
      if (level === 0) continue;
      const mod = def.modifier(level);
      if (mod.maxHpMultiplier)  maxHp            = Math.round(maxHp * mod.maxHpMultiplier);
      if (mod.speedMultiplier)  speed            *= mod.speedMultiplier;
      if (mod.damageMultiplier) damageMultiplier *= mod.damageMultiplier;
      if (mod.xpMultiplier)     xpMultiplier     *= mod.xpMultiplier;
      if (mod.goldMultiplier)   goldMultiplier   *= mod.goldMultiplier;
      if (mod.magnetRadius)     magnetRadius     += mod.magnetRadius;
      if (mod.armor)            armor            += mod.armor;
      if (mod.critChance)       critChance       += mod.critChance;
      if (mod.cooldownMult)     cooldownMult     *= mod.cooldownMult;
      if (mod.lifesteal)        lifesteal        += mod.lifesteal;
      if (mod.chestLuck)        chestLuck        += mod.chestLuck;
      if (mod.revives)          revives          += mod.revives;
    }

    const base: PlayerStats = {
      maxHp, speed, damageMultiplier, xpMultiplier, goldMultiplier, magnetRadius, armor,
      ...DEFAULT_COMBAT_STATS,
      critChance, cooldownMult, lifesteal, chestLuck, revives,
    };

    // Apply character-specific modifiers
    const charId = characterId ?? selectedCharacterId;
    const char = getCharacter(charId);
    return applyCharacterMods(base, char.statModifiers);
  },

  getUnlockedWeaponIds(): string[] {
    return get().unlockedWeapons;
  },
}));
