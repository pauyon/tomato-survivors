// Procedural placeholder sprites for each playable character.
// All share drawTommyTomato's signature so RenderSystem can dispatch by character id.

import { drawTommyTomato, type PlayerState } from './PlayerSprite';
import daybreakSheet from '../daybreak.png';

export type DrawCharacterFn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: PlayerState,
  frame: number,
  facingRight: boolean,
) => void;

/**
 * Builds a draw function for a horizontal sprite sheet of `frameCount` square
 * `frameW`x`frameH` frames. Renders crisp (integer scale, pixel-snapped),
 * matching drawTommyTomato's conventions.
 */
const SHEET_SCALE = 2;  // integer scale — clean 2× pixel blocks
const SHEET_FOOT = 18;  // world-y below the player where feet/shadow sit

function makeSheetDrawer(src: string, frameCount: number, frameW = 32, frameH = 32): DrawCharacterFn {
  const img = new Image();
  img.src = src;
  return (ctx, x, y, state, frame, facingRight) => {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    ctx.beginPath();
    ctx.ellipse(0, SHEET_FOOT, 15, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    if (!img.complete || img.naturalWidth === 0) { ctx.restore(); return; }

    const f = ((Math.floor(frame) % frameCount) + frameCount) % frameCount;
    const dw = frameW * SHEET_SCALE;
    const dh = frameH * SHEET_SCALE;
    if (!facingRight) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    const dx = -dw / 2;
    const dy = -dh + SHEET_FOOT;
    ctx.drawImage(img, f * frameW, 0, frameW, frameH, dx, dy, dw, dh);

    // Hurt flash on the sprite's pixels only (white silhouette via image filter).
    if (state === 'hurt') {
      ctx.globalAlpha = 0.6;
      ctx.filter = 'brightness(0) invert(1)';
      ctx.drawImage(img, f * frameW, 0, frameW, frameH, dx, dy, dw, dh);
    }
    ctx.restore();
  };
}

export const drawDaybreak = makeSheetDrawer(daybreakSheet, 4);

/** Shared setup: shadow, bob/squash, facing flip. Calls `body` in local space. */
function withBody(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  state: PlayerState, frame: number, facingRight: boolean,
  body: (squash: number) => void,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);

  const bobY = state === 'walk' ? Math.sin(frame * 0.8) * 2 : Math.sin(Date.now() * 0.002) * 1;
  const squash = state === 'walk' ? 1 + Math.sin(frame * 0.8) * 0.06 : 1;

  // Shadow
  ctx.save();
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 20 / squash, 10, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.restore();

  ctx.translate(0, bobY);
  body(squash);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, state: PlayerState, eyeY = -2, mouthY = 4): void {
  if (state === 'hurt') {
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    for (const ex of [-5, 5]) {
      ctx.beginPath();
      ctx.moveTo(ex - 2, eyeY - 2); ctx.lineTo(ex + 2, eyeY + 2);
      ctx.moveTo(ex + 2, eyeY - 2); ctx.lineTo(ex - 2, eyeY + 2);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.ellipse(-5, eyeY, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, eyeY, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-4.5, eyeY + 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5, eyeY + 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, mouthY, 4.5, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = 'rgba(60,40,30,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
}

export function drawGarlicGary(ctx: CanvasRenderingContext2D, x: number, y: number, state: PlayerState, frame: number, facingRight: boolean): void {
  withBody(ctx, x, y, state, frame, facingRight, (squash) => {
    ctx.save();
    ctx.scale(squash, 1 / squash);
    // Bulb body (cream, scalloped bottom)
    ctx.beginPath();
    ctx.moveTo(-13, 2);
    ctx.bezierCurveTo(-15, -14, -4, -16, 0, -16);
    ctx.bezierCurveTo(4, -16, 15, -14, 13, 2);
    // scalloped base
    ctx.bezierCurveTo(10, 12, 6, 8, 0, 14);
    ctx.bezierCurveTo(-6, 8, -10, 12, -13, 2);
    ctx.closePath();
    const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, 16);
    grad.addColorStop(0, '#fffaf0');
    grad.addColorStop(1, '#dfd2b8');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 1.5; ctx.stroke();
    // Clove seams
    ctx.strokeStyle = 'rgba(180,160,130,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(-4, 10); ctx.moveTo(5, -14); ctx.lineTo(4, 10); ctx.stroke();
    ctx.restore();
    if (state === 'hurt') { ctx.beginPath(); ctx.arc(0, -2, 15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); }
    // Green sprout
    ctx.strokeStyle = '#3a9e3a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(-2, -24); ctx.moveTo(0, -15); ctx.lineTo(3, -23); ctx.stroke();
    drawFace(ctx, state);
  });
}

export function drawPepperPete(ctx: CanvasRenderingContext2D, x: number, y: number, state: PlayerState, frame: number, facingRight: boolean): void {
  withBody(ctx, x, y, state, frame, facingRight, (squash) => {
    ctx.save();
    ctx.scale(squash, 1 / squash);
    // Curved chili body
    ctx.beginPath();
    ctx.moveTo(-9, -10);
    ctx.bezierCurveTo(-14, 4, -6, 16, 2, 15);
    ctx.bezierCurveTo(12, 14, 13, 0, 9, -10);
    ctx.bezierCurveTo(5, -14, -5, -14, -9, -10);
    ctx.closePath();
    const grad = ctx.createLinearGradient(-9, -10, 6, 15);
    grad.addColorStop(0, '#ff7a33');
    grad.addColorStop(0.6, '#ef4423');
    grad.addColorStop(1, '#c01818');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#9a1414'; ctx.lineWidth = 1.5; ctx.stroke();
    // Highlight
    ctx.beginPath(); ctx.ellipse(-3, -2, 2, 8, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    ctx.restore();
    if (state === 'hurt') { ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); }
    // Green stem
    ctx.strokeStyle = '#2d8a2d'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4, -20); ctx.stroke();
    drawFace(ctx, state, -4, 4);
  });
}

export function drawCherryBomb(ctx: CanvasRenderingContext2D, x: number, y: number, state: PlayerState, frame: number, facingRight: boolean): void {
  withBody(ctx, x, y, state, frame, facingRight, (squash) => {
    ctx.save();
    ctx.scale(squash, 1 / squash);
    // Round cherry body
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 14);
    grad.addColorStop(0, '#ff4d6a');
    grad.addColorStop(0.6, '#cc1144');
    grad.addColorStop(1, '#8a0a2a');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#5a0418'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    if (state === 'hurt') { ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); }
    // Stem + lit fuse spark
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1, -13); ctx.quadraticCurveTo(6, -22, 4, -26); ctx.stroke();
    const spark = 2 + Math.sin(Date.now() * 0.02) * 1;
    ctx.beginPath(); ctx.arc(4, -27, spark, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd23a'; ctx.fill();
    drawFace(ctx, state);
  });
}

export const CHARACTER_SPRITES: Record<string, DrawCharacterFn> = {
  tommy_tomato: drawTommyTomato,
  daybreak:     drawDaybreak,
  garlic_gary:  drawGarlicGary,
  pepper_pete:  drawPepperPete,
  cherry_bomb:  drawCherryBomb,
};

export function getCharacterSprite(id: string): DrawCharacterFn {
  return CHARACTER_SPRITES[id] ?? drawTommyTomato;
}
