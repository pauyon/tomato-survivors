// Sprite-sheet renderer for weapon attacks. Each sheet is a single horizontal
// strip of equal frames. Frame geometry is derived from the loaded image and
// sliced proportionally, so non-divisible widths don't drift. If a sheet isn't
// loaded yet, drawAttackSprite returns false so the caller can fall back to the
// procedural placeholder (same pattern as EnemySpriteRenderer).
//
// These are detailed/soft sprites (not 1px pixel art), so they're drawn with
// image smoothing ON for clean downscaling.

export type AttackSpriteId =
  | 'seed'
  | 'tomato-knife'
  | 'tomato-seeker'
  | 'garden-axe'
  | 'fertilizer-pot'
  | 'compost-bomb'
  | 'compost-blast'
  | 'fertilizer-splash'
  | 'vine-whip'
  | 'pesticide-spray'
  | 'weed-whacker';

interface SheetCfg { frames: number; fps: number; }

const CONFIG: Record<AttackSpriteId, SheetCfg> = {
  'seed':              { frames: 4, fps: 12 },
  'tomato-knife':      { frames: 4, fps: 14 },
  'tomato-seeker':     { frames: 4, fps: 14 },
  'garden-axe':        { frames: 6, fps: 18 },
  'fertilizer-pot':    { frames: 4, fps: 10 },
  'compost-bomb':      { frames: 4, fps: 10 },
  'compost-blast':     { frames: 7, fps: 20 },
  'fertilizer-splash': { frames: 6, fps: 18 },
  'vine-whip':         { frames: 6, fps: 22 },
  'pesticide-spray':   { frames: 5, fps: 18 },
  'weed-whacker':      { frames: 5, fps: 20 },
};

const BASE = '/assets/sprites/attacks/';
const images: Record<string, HTMLImageElement> = {};
for (const id of Object.keys(CONFIG) as AttackSpriteId[]) {
  const img = new Image();
  img.src = `${BASE}${id}.png`;
  images[id] = img;
}

export interface AttackDrawOpts {
  /** On-screen frame-box width in world px (height follows the art aspect). */
  width: number;
  /** Explicit frame index. Otherwise derived from `progress` or `animTime`. */
  frame?: number;
  /** 0..1 progress through a one-shot animation → maps across the strip. */
  progress?: number;
  /** Elapsed seconds → looping/clamped frame at the sheet's fps. */
  animTime?: number;
  /** When using animTime, loop (default) or clamp on the last frame. */
  loop?: boolean;
  /** Rotation in radians (sheets face +x / right). */
  rotation?: number;
  /** Anchor within the frame box, 0..1. Default center (0.5, 0.5). */
  anchorX?: number;
  anchorY?: number;
  alpha?: number;
}

export function drawAttackSprite(
  ctx: CanvasRenderingContext2D,
  id: AttackSpriteId,
  x: number,
  y: number,
  opts: AttackDrawOpts,
): boolean {
  const img = images[id];
  const cfg = CONFIG[id];
  if (!img || !img.complete || img.naturalWidth === 0) return false;

  const W = img.naturalWidth;
  const H = img.naturalHeight;

  let f: number;
  if (opts.frame != null) {
    f = opts.frame;
  } else if (opts.progress != null) {
    f = Math.floor(Math.max(0, Math.min(0.9999, opts.progress)) * cfg.frames);
  } else {
    const raw = Math.floor((opts.animTime ?? 0) * cfg.fps);
    f = opts.loop === false ? Math.min(cfg.frames - 1, raw) : ((raw % cfg.frames) + cfg.frames) % cfg.frames;
  }
  f = Math.max(0, Math.min(cfg.frames - 1, f));

  // Proportional slice so non-divisible sheet widths don't accumulate drift.
  const sx = Math.round((f * W) / cfg.frames);
  const sw = Math.round(((f + 1) * W) / cfg.frames) - sx;

  const aspect = sw / H;
  const dw = opts.width;
  const dh = dw / aspect;
  const ax = opts.anchorX ?? 0.5;
  const ay = opts.anchorY ?? 0.5;

  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.translate(x, y);
  if (opts.rotation) ctx.rotate(opts.rotation);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, 0, sw, H, -dw * ax, -dh * ay, dw, dh);
  ctx.restore();
  return true;
}
