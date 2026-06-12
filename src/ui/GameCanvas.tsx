import { useEffect, useRef, useState, useCallback } from 'react';
import { Game, type GameResult, type LiveStats } from '../game/Game';
import type { PlayerStats } from '../game/entities/Player';
import type { Upgrade, ChestReward } from '../game/upgrades/UpgradeRegistry';
import { HUD } from './HUD';
import { LevelUpScreen } from './LevelUpScreen';
import { ChestOpenScreen } from './ChestOpenScreen';
import { GameOverScreen } from './GameOverScreen';

interface GameCanvasProps {
  playerStats: PlayerStats;
  unlockedWeaponIds: string[];
  startingWeaponId: string;
  characterId: string;
  onRunEnd: (gold: number, survived: number, kills: number) => void;
  onMainMenu: () => void;
}

interface UIState {
  mode: 'running' | 'paused' | 'levelup' | 'chest' | 'gameover' | 'victory';
  levelUpOptions: Upgrade[];
  chestReward: ChestReward | null;
  playerLevel: number;
  stats: LiveStats;
  result: GameResult | null;
}

const DEFAULT_STATS: LiveStats = {
  hp: 100, maxHp: 100, xp: 0, xpToNext: 10, level: 1,
  elapsed: 0, gold: 0, kills: 0, weapons: [], passives: [],
};

export function GameCanvas({ playerStats, unlockedWeaponIds, startingWeaponId, characterId, onRunEnd, onMainMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef   = useRef<Game | null>(null);
  const [ui, setUI] = useState<UIState>({
    mode: 'running', levelUpOptions: [], chestReward: null, playerLevel: 1,
    stats: DEFAULT_STATS, result: null,
  });

  // Stable callbacks so Game doesn't re-capture stale closures
  const handleStateChange = useCallback((state: UIState['mode']) => {
    setUI(prev => ({ ...prev, mode: state }));
  }, []);

  const handleLevelUp = useCallback((options: Upgrade[]) => {
    setUI(prev => ({ ...prev, levelUpOptions: options, playerLevel: prev.stats.level }));
  }, []);

  const handleChestOpen = useCallback((reward: ChestReward) => {
    setUI(prev => ({ ...prev, chestReward: reward }));
  }, []);

  const handleGameOver = useCallback((result: GameResult) => {
    setUI(prev => ({ ...prev, result }));
    onRunEnd(result.gold, result.survived, result.kills);
  }, [onRunEnd]);

  const handleVictory = useCallback((result: GameResult) => {
    setUI(prev => ({ ...prev, result }));
    onRunEnd(result.gold, result.survived, result.kills);
  }, [onRunEnd]);

  const handleStatsUpdate = useCallback((stats: LiveStats) => {
    setUI(prev => ({ ...prev, stats }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas to window
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gameRef.current?.resize(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const game = new Game(canvas, playerStats, unlockedWeaponIds, startingWeaponId, characterId, {
      onStateChange: handleStateChange,
      onLevelUp:     handleLevelUp,
      onChestOpen:   handleChestOpen,
      onGameOver:    handleGameOver,
      onVictory:     handleVictory,
      onStatsUpdate: handleStatsUpdate,
    });
    gameRef.current = game;
    game.start();

    return () => {
      game.destroy();
      gameRef.current = null;
      window.removeEventListener('resize', resize);
    };
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChooseUpgrade = (upgrade: Upgrade) => {
    gameRef.current?.applyUpgrade(upgrade);
  };

  const handleClaimChest = (reward: ChestReward) => {
    gameRef.current?.applyChestReward(reward);
    setUI(prev => ({ ...prev, chestReward: null }));
  };

  const handleTogglePause = () => {
    gameRef.current?.togglePause();
  };

  const handleRestart = () => {
    onMainMenu(); // parent will remount GameCanvas with a fresh game
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d1a08' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* HUD overlay (always visible during play) */}
      {(ui.mode === 'running' || ui.mode === 'paused' || ui.mode === 'levelup' || ui.mode === 'chest') && (
        <HUD
          stats={ui.stats}
          isPaused={ui.mode === 'paused'}
          onTogglePause={handleTogglePause}
        />
      )}

      {/* Pause banner */}
      {ui.mode === 'paused' && (
        <div style={pauseStyle}>
          <div style={{ color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 8 }}>⏸ Paused</div>
          <div style={{ color: '#aaa', fontSize: 14 }}>Press Esc or click ▶ to resume</div>
        </div>
      )}

      {/* Level-up overlay */}
      {ui.mode === 'levelup' && (
        <LevelUpScreen
          options={ui.levelUpOptions}
          level={ui.playerLevel}
          onChoose={handleChooseUpgrade}
        />
      )}

      {/* Treasure chest overlay */}
      {ui.mode === 'chest' && ui.chestReward && (
        <ChestOpenScreen
          reward={ui.chestReward}
          onClaim={handleClaimChest}
        />
      )}

      {/* Game over / victory */}
      {(ui.mode === 'gameover' || ui.mode === 'victory') && ui.result && (
        <GameOverScreen
          result={ui.result}
          isVictory={ui.mode === 'victory'}
          onMainMenu={onMainMenu}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

const pauseStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.5)',
  fontFamily: '"Courier New", monospace',
  pointerEvents: 'none',
};
