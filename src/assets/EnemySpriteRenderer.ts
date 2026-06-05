// Sprite-sheet renderer for enemies. Each enemy has a horizontal strip of equal
// frames (a walk/idle loop). The sheets are pixel art, so frames are drawn crisp
// (image smoothing OFF, pixel-snapped). If a sheet hasn't loaded yet,
// drawEnemySprite returns false so the caller can fall back to the placeholder.

import type { EnemyType } from '../game/entities/Enemy';
import { SPRITES } from './manifest';

interface EnemySpriteCfg {
  src: string;
  frames: number;
  fps: number;
  /** On-screen height of the sprite in world units. Width follows the art aspect. */
  displayHeight: number;
}

// The source art faces LEFT; we flip horizontally when the enemy moves right.
const CONFIG: Record<EnemyType, EnemySpriteCfg> = {
  rotSpore:    { src: SPRITES.enemies.rotSpore,    frames: 4, fps: 6, displayHeight: 40 },
  aphid:       { src: SPRITES.enemies.aphid,       frames: 4, fps: 9, displayHeight: 28 },
  caterpillar: { src: SPRITES.enemies.caterpillar, frames: 4, fps: 6, displayHeight: 34 },
  beetle:      { src: SPRITES.enemies.beetle,      frames: 4, fps: 5, displayHeight: 46 },
};

const images: Record<string, HTMLImageElement> = {};
for (const cfg of Object.values(CONFIG)) {
  const img = new Image();
  img.src = cfg.src;
  images[cfg.src] = img;
}

/**
 * Draws the current animation frame for an enemy centered near (x, y).
 * Returns false if the sheet isn't ready (caller should draw a placeholder).
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  animTime: number,
  vx: number,
): boolean {
  const cfg = CONFIG[type];
  const img = images[cfg.src];
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Frame index from elapsed time, wrapped into [0, frames).
  const f = ((Math.floor(animTime * cfg.fps) % cfg.frames) + cfg.frames) % cfg.frames;
  // Proportional slice boundaries so non-divisible sheet widths don't drift.
  const sx = Math.round((f * W) / cfg.frames);
  const sw = Math.round(((f + 1) * W) / cfg.frames) - sx;

  const scale = cfg.displayHeight / H;
  const dw = Math.round(sw * scale);
  const dh = Math.round(cfg.displayHeight);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Contact shadow on the ground beneath the sprite.
  ctx.beginPath();
  ctx.ellipse(0, dh * 0.32, dw * 0.34, dh * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

  // Face the direction of travel (art faces left by default).
  if (vx > 10) ctx.scale(-1, 1);

  ctx.imageSmoothingEnabled = false; // crisp pixel art
  // Anchored so the sprite sits with its feet roughly on (x, y).
  ctx.drawImage(img, sx, 0, sw, H, Math.round(-dw / 2), Math.round(-dh * 0.62), dw, dh);

  ctx.restore();
  return true;
}
