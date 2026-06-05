// Tommy Tomato — drawn from a 4-frame sprite sheet (128x32, four 32x32 frames).

import tommySheet from '../tommy.png';

export type PlayerState = 'idle' | 'walk' | 'hurt';

const FRAME_W = 32;
const FRAME_H = 32;
const FRAME_COUNT = 4;
// Pixel art only stays crisp at INTEGER scale. 2× = clean 2x2 pixel blocks.
const SCALE = 2;
const FOOT = 18; // world-y below the player where the feet/shadow sit

const sheet = new Image();
sheet.src = tommySheet;

export function drawTommyTomato(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: PlayerState,
  frame: number,  // animation frame index
  facingRight: boolean,
): void {
  ctx.save();
  // Snap to whole pixels so the sprite never lands on a fractional coordinate
  // (which causes the "weird" shimmer/smoothing on pixel art).
  ctx.translate(Math.round(x), Math.round(y));

  // Ground shadow (always under the feet, unaffected by facing)
  ctx.beginPath();
  ctx.ellipse(0, FOOT, 15, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Sprite not yet decoded — skip this frame rather than drawing nothing odd.
  if (!sheet.complete || sheet.naturalWidth === 0) {
    ctx.restore();
    return;
  }

  const f = ((Math.floor(frame) % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
  const sx = f * FRAME_W;
  const dw = FRAME_W * SCALE;
  const dh = FRAME_H * SCALE;

  if (!facingRight) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false; // never smooth pixel art

  // Integer offsets; feet sit near the bottom of the hitbox.
  const dx = -dw / 2;
  const dy = -dh + FOOT;
  ctx.drawImage(sheet, sx, 0, FRAME_W, FRAME_H, dx, dy, dw, dh);

  // Hurt flash: redraw the sprite as a white silhouette over itself. Using a
  // filter on the image (not a fillRect) keeps it to the PNG's actual pixels.
  if (state === 'hurt') {
    ctx.globalAlpha = 0.6;
    ctx.filter = 'brightness(0) invert(1)';
    ctx.drawImage(sheet, sx, 0, FRAME_W, FRAME_H, dx, dy, dw, dh);
  }

  ctx.restore();
}
