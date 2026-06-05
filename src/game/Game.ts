// Top-level game state machine.
// Orchestrates the World, GameLoop, Camera, and signals to the React UI.

import { GameLoop } from '../engine/GameLoop';
import { Camera } from '../engine/Camera';
import { input } from '../engine/InputManager';
import { World } from './World';
import { RenderSystem } from './systems/RenderSystem';
import type { PlayerStats } from './entities/Player';
import { buildLevelUpOptions, type Upgrade, type ChestReward } from './upgrades/UpgradeRegistry';

export type GameState = 'running' | 'paused' | 'levelup' | 'chest' | 'gameover' | 'victory';

export interface GameResult {
  survived: number;  // seconds
  kills: number;
  score: number;
  gold: number;
}

export interface GameCallbacks {
  onStateChange: (state: GameState) => void;
  onLevelUp: (options: Upgrade[]) => void;
  onChestOpen: (reward: ChestReward) => void;
  onGameOver: (result: GameResult) => void;
  onVictory: (result: GameResult) => void;
  onStatsUpdate: (stats: LiveStats) => void;
}

export interface LiveStats {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  elapsed: number;
  gold: number;
  kills: number;
  weapons: { name: string; icon: string; level: number; stacks: number }[];
}

export class Game {
  private loop: GameLoop;
  private camera: Camera;
  private world: World;
  private renderer = new RenderSystem();
  private ctx: CanvasRenderingContext2D;
  private state: GameState = 'running';
  private callbacks: GameCallbacks;
  private statsTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    playerStats: PlayerStats,
    unlockedWeaponIds: string[],
    startingWeaponId: string,
    characterId: string,
    callbacks: GameCallbacks,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.camera = new Camera(canvas.width, canvas.height);
    this.world = new World({ playerStats, unlockedWeaponIds, startingWeaponId, characterId });
    this.callbacks = callbacks;

    this.world.onLevelUp = () => {
      if (this.state !== 'running') return;
      this.state = 'levelup';
      const options = buildLevelUpOptions(this.world.player, this.world.weapons, this.world.unlockedWeaponIds);
      callbacks.onStateChange('levelup');
      callbacks.onLevelUp(options);
    };

    this.world.onChestOpen = (reward) => {
      if (this.state !== 'running') return;
      this.state = 'chest';
      callbacks.onStateChange('chest');
      callbacks.onChestOpen(reward);
    };

    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha),
    });

    input.bind();
  }

  start(): void {
    this.loop.start();
  }

  destroy(): void {
    this.loop.stop();
    input.unbind();
  }

  resize(width: number, height: number): void {
    this.camera.resize(width, height);
  }

  /** Called from React when the player picks an upgrade. */
  applyUpgrade(upgrade: Upgrade): void {
    upgrade.apply(this.world.player, this.world.weapons);
    this.world.particles.spawnLevelUp(this.world.player.x, this.world.player.y);
    this.state = 'running';
    this.callbacks.onStateChange('running');
  }

  /** Called from React when the player claims a treasure chest reward. */
  applyChestReward(reward: ChestReward): void {
    this.world.player.gold += reward.gold;
    reward.upgrade.apply(this.world.player, this.world.weapons);
    this.world.particles.spawnLevelUp(this.world.player.x, this.world.player.y);
    this.state = 'running';
    this.callbacks.onStateChange('running');
  }

  togglePause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
      this.callbacks.onStateChange('paused');
    } else if (this.state === 'paused') {
      this.state = 'running';
      this.callbacks.onStateChange('running');
    }
  }

  private update(dt: number): void {
    if (this.state !== 'running') return;

    const move = input.getMovement();
    this.world.update(dt, this.camera, move.x, move.y);

    // Stats update (throttled to 10 Hz to avoid React re-render spam)
    this.statsTimer += dt;
    if (this.statsTimer >= 0.1) {
      this.statsTimer = 0;
      this.emitStats();
    }

    // Escape key → pause
    if (input.isDown('escape')) {
      this.togglePause();
    }

    if (!this.world.player.alive) {
      this.state = 'gameover';
      this.callbacks.onStateChange('gameover');
      this.callbacks.onGameOver(this.buildResult());
    }

    if (this.world.isVictory) {
      this.state = 'victory';
      this.callbacks.onStateChange('victory');
      this.callbacks.onVictory(this.buildResult());
    }
  }

  private render(alpha: number): void {
    // Apply screen shake via CSS
    const shake = this.camera.getShakeTransform();
    this.ctx.canvas.style.transform = shake;

    this.renderer.render(this.ctx, this.world, this.camera, alpha);
  }

  private emitStats(): void {
    const { player } = this.world;
    this.callbacks.onStatsUpdate({
      hp: player.hp,
      maxHp: player.stats.maxHp,
      xp: player.xp,
      xpToNext: player.xpToNextLevel,
      level: player.level,
      elapsed: this.world.elapsed,
      gold: player.gold,
      kills: this.world.killCount,
      weapons: player.weapons.map(w => ({ name: w.name, icon: w.icon, level: w.level, stacks: w.stacks })),
    });
  }

  private buildResult(): GameResult {
    const { player } = this.world;
    return {
      survived: this.world.elapsed,
      kills: this.world.killCount,
      score: this.world.score,
      gold: player.gold,
    };
  }
}
