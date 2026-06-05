import { useState, useEffect } from 'react';
import { MainMenu } from './ui/MainMenu';
import { GardenScreen } from './ui/GardenScreen';
import { CharacterSelectScreen } from './ui/CharacterSelectScreen';
import { GameCanvas } from './ui/GameCanvas';
import { useMetaStore } from './meta/MetaStore';
import { getCharacter } from './game/characters/CharacterRegistry';

type Screen = 'menu' | 'garden' | 'character_select' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameKey, setGameKey] = useState(0);
  const { load, getPlayerStats, getUnlockedWeaponIds, recordRun, selectedCharacterId } = useMetaStore();

  useEffect(() => { load(); }, [load]);

  const handleConfirmCharacter = (_characterId: string) => {
    setGameKey(k => k + 1);
    setScreen('game');
  };

  const handleRunEnd = (gold: number, survived: number, kills: number) => {
    recordRun(gold, survived, kills);
  };

  // Build the current character's starting weapon for the game
  const character = getCharacter(selectedCharacterId);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {screen === 'menu' && (
        <MainMenu
          onPlay={() => setScreen('character_select')}
          onGarden={() => setScreen('garden')}
        />
      )}
      {screen === 'garden' && (
        <GardenScreen onBack={() => setScreen('menu')} />
      )}
      {screen === 'character_select' && (
        <CharacterSelectScreen
          onConfirm={handleConfirmCharacter}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'game' && (
        <GameCanvas
          key={gameKey}
          playerStats={getPlayerStats(selectedCharacterId)}
          unlockedWeaponIds={getUnlockedWeaponIds()}
          startingWeaponId={character.startingWeapon}
          characterId={selectedCharacterId}
          onRunEnd={handleRunEnd}
          onMainMenu={() => setScreen('menu')}
        />
      )}
    </div>
  );
}
