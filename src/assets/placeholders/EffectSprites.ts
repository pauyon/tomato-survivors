// Procedural placeholders for projectiles, XP gems, particles, and tiles.

import vineWhipSheet from '../vinewhip.png';

// Vine Whip sprite sheet: 7 frames (64x32 each) — a green whip cracking outward.
const WHIP_FW = 64;
const WHIP_FH = 32;
const WHIP_COUNT = 7;
const WHIP_HANDLE_FX = 0.1;  // whip origin x within a frame (fraction)
const WHIP_HANDLE_FY = 0.5;  // whip origin y within a frame (fraction)
const WHIP_SPAN_FRAC = 0.8;  // origin→tip distance as a fraction of frame width
const WHIP_ZOOM = 1.7;       // visual size multiplier (purely cosmetic)

// Source art has a solid (non-white) background and no alpha. Isolate the green
// whip pixels into an offscreen canvas, making everything else transparent.
let whipKeyed: HTMLCanvasElement | null = null;
const whipImg = new Image();
whipImg.src = vineWhipSheet;
whipImg.onload = () => {
  const c = document.createElement('canvas');
  c.width = whipImg.naturalWidth;
  c.height = whipImg.naturalHeight;
  const cx = c.getContext('2d');
  if (!cx) return;
  cx.drawImage(whipImg, 0, 0);
  const img = cx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // Keep green-dominant pixels (the whip); drop the rest.
    if (!(g > 100 && g > r && g > b)) d[i + 3] = 0;
  }
  cx.putImageData(img, 0, 0);
  whipKeyed = c;
};

/**
 * Draws the vine whip flicking out from (x, y) toward `angle` (0 = right, π = left).
 * `radius` is the weapon's reach, so the whip scales with the character/level.
 * `life` (1→0) drives the crack animation across the 5 frames.
 */
export function drawVineWhipSprite(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, life: number): void {
  if (!whipKeyed) return;

  // Progress 0→1 over the effect's life. Snap out fast (easeOutCubic) over the
  // first ~55%, then hold fully extended while fading — so the tip clearly
  // travels outward from the hand instead of wiggling in place.
  const p = Math.min(1, Math.max(0, 1 - life));
  const ext = Math.min(1, p / 0.55);
  const e = 1 - Math.pow(1 - ext, 3);

  const f = Math.min(WHIP_COUNT - 1, Math.floor(e * (WHIP_COUNT - 0.0001)));
  const lenScale = 0.3 + 0.7 * e;             // grows from short stub to full reach
  const drawnW = (radius / WHIP_SPAN_FRAC) * lenScale * WHIP_ZOOM;
  const scale = drawnW / WHIP_FW;
  const drawnH = WHIP_FH * scale;             // preserve the 2:1 frame ratio

  ctx.save();
  ctx.translate(x, y);
  if (Math.cos(angle) < 0) ctx.scale(-1, 1); // mirror for the left-side strike
  ctx.imageSmoothingEnabled = false;         // low-res pixel art scaled up — keep it crisp
  ctx.globalAlpha = Math.min(1, life * 2.6); // fades only in the final stretch
  ctx.drawImage(
    whipKeyed,
    f * WHIP_FW, 0, WHIP_FW, WHIP_FH,
    -WHIP_HANDLE_FX * drawnW, -WHIP_HANDLE_FY * drawnH, drawnW, drawnH,
  );
  ctx.restore();
}

export function drawSeedProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, speed: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Motion trail
  const trailLen = Math.min(speed * 4, 14);
  const trailGrad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
  trailGrad.addColorStop(0, 'rgba(200,220,80,0)');
  trailGrad.addColorStop(1, 'rgba(200,220,80,0.4)');
  ctx.beginPath();
  ctx.moveTo(0, -1.5);
  ctx.lineTo(-trailLen, 0);
  ctx.lineTo(0, 1.5);
  ctx.fillStyle = trailGrad;
  ctx.fill();

  // Seed body
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c8dc50';
  ctx.fill();
  ctx.strokeStyle = '#8a9c20';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Seed tip
  ctx.beginPath();
  ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e8f060';
  ctx.fill();

  ctx.restore();
}

export function drawXPGem(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);

  const scale = value > 5 ? 1.3 : (value > 1 ? 1.0 : 0.7);
  const glow = 0.5 + Math.sin(t * 4) * 0.3;
  ctx.scale(scale, scale);

  // Glow
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
  glowGrad.addColorStop(0, `rgba(80,240,255,${glow * 0.4})`);
  glowGrad.addColorStop(1, 'rgba(80,240,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  const gemGrad = ctx.createLinearGradient(0, -7, 0, 5);
  gemGrad.addColorStop(0, '#a0f0ff');
  gemGrad.addColorStop(0.4, '#30d0f0');
  gemGrad.addColorStop(1, '#0890b0');
  ctx.fillStyle = gemGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Inner facet
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(2.5, 0);
  ctx.lineTo(0, 3);
  ctx.lineTo(-2.5, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  ctx.restore();
}

export function drawGoldCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);

  const spin = Math.abs(Math.sin(t * 3));
  ctx.scale(spin, 1);

  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  const coinGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  coinGrad.addColorStop(0, '#ffe878');
  coinGrad.addColorStop(0.7, '#f0b820');
  coinGrad.addColorStop(1, '#b87800');
  ctx.fillStyle = coinGrad;
  ctx.fill();
  ctx.strokeStyle = '#8a5800';
  ctx.lineWidth = 1;
  ctx.stroke();

  // $ symbol
  ctx.fillStyle = '#8a5800';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0.5);

  ctx.restore();
}

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 1 + Math.sin(t * 5) * 0.08;
  ctx.scale(pulse, pulse);

  // Glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 11);
  glow.addColorStop(0, 'rgba(255,80,90,0.4)');
  glow.addColorStop(1, 'rgba(255,80,90,0)');
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fillStyle = glow; ctx.fill();

  // Heart shape
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-7, -2, -5, -8, 0, -4);
  ctx.bezierCurveTo(5, -8, 7, -2, 0, 5);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, -6, 0, 5);
  grad.addColorStop(0, '#ff7a8a');
  grad.addColorStop(1, '#e63347');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#a01828'; ctx.lineWidth = 1; ctx.stroke();

  // Shine
  ctx.beginPath(); ctx.ellipse(-2, -2, 1.4, 2, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();

  ctx.restore();
}

/** Treasure chest. openT: 0 = closed, 1 = fully open (lid up, glow). */
export function drawTreasureChest(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, openT = 0): void {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 11, 13, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();

  const bob = openT === 0 ? Math.sin(t * 3) * 0.8 : 0;
  ctx.translate(0, bob);

  // Glow when opening
  if (openT > 0) {
    const glow = ctx.createRadialGradient(0, -2, 0, 0, -2, 24 * openT);
    glow.addColorStop(0, `rgba(255,235,130,${0.8 * openT})`);
    glow.addColorStop(1, 'rgba(255,235,130,0)');
    ctx.beginPath(); ctx.arc(0, -2, 24 * openT, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
  }

  // Chest base
  ctx.beginPath();
  ctx.rect(-11, -2, 22, 12);
  const baseGrad = ctx.createLinearGradient(0, -2, 0, 10);
  baseGrad.addColorStop(0, '#9c6b2e');
  baseGrad.addColorStop(1, '#6e4a1c');
  ctx.fillStyle = baseGrad; ctx.fill();
  ctx.strokeStyle = '#3d2a10'; ctx.lineWidth = 1.5; ctx.stroke();

  // Metal bands
  ctx.strokeStyle = '#caa030'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6, 10); ctx.moveTo(6, -2); ctx.lineTo(6, 10); ctx.stroke();

  // Lid (rotates up as it opens)
  ctx.save();
  ctx.translate(0, -2);
  ctx.rotate(-openT * 0.9);
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-11, -5);
  ctx.quadraticCurveTo(0, -12, 11, -5);
  ctx.lineTo(11, 0);
  ctx.closePath();
  const lidGrad = ctx.createLinearGradient(0, -12, 0, 0);
  lidGrad.addColorStop(0, '#b07c34');
  lidGrad.addColorStop(1, '#85591f');
  ctx.fillStyle = lidGrad; ctx.fill();
  ctx.strokeStyle = '#3d2a10'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Lock
  ctx.beginPath();
  ctx.rect(-2.5, 0, 5, 5);
  ctx.fillStyle = '#ffe070'; ctx.fill();
  ctx.strokeStyle = '#8a5800'; ctx.lineWidth = 0.8; ctx.stroke();

  ctx.restore();
}

export function drawHitSpark(ctx: CanvasRenderingContext2D, x: number, y: number, life: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = life;

  const rays = 6;
  const len = 8 * life;
  ctx.strokeStyle = '#ffee44';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2);
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawVineWhipEffect(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.arc(0, 0, radius, -Math.PI / 3, Math.PI / 3);
  ctx.strokeStyle = '#3aaa3a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Thorns along the whip
  const thornCount = 4;
  for (let i = 0; i < thornCount; i++) {
    const thornAngle = -Math.PI / 3 + (i / (thornCount - 1)) * (Math.PI * 2 / 3);
    const tx = Math.cos(thornAngle) * radius;
    const ty = Math.sin(thornAngle) * radius;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(thornAngle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, -6);
    ctx.lineTo(0, -3);
    ctx.closePath();
    ctx.fillStyle = '#1e7a1e';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawCompostExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, life: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Expanding ring
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(120,80,40,${life})`;
  ctx.lineWidth = 3 * life;
  ctx.stroke();

  // Inner debris cloud
  ctx.globalAlpha = life * 0.6;
  const debrisCount = 8;
  for (let i = 0; i < debrisCount; i++) {
    const angle = (i / debrisCount) * Math.PI * 2;
    const r = radius * 0.6;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 4 * life, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${100 + Math.random() * 60},${60 + Math.random() * 40},20)`;
    ctx.fill();
  }

  ctx.restore();
}

export function drawObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, type: 'rock' | 'crate' | 'bush', radius: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.7, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  if (type === 'rock') {
    ctx.beginPath();
    ctx.moveTo(-radius, radius * 0.4);
    ctx.lineTo(-radius * 0.7, -radius * 0.5);
    ctx.lineTo(-radius * 0.1, -radius);
    ctx.lineTo(radius * 0.6, -radius * 0.6);
    ctx.lineTo(radius, radius * 0.2);
    ctx.lineTo(radius * 0.5, radius * 0.6);
    ctx.lineTo(-radius * 0.4, radius * 0.6);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -radius, 0, radius);
    grad.addColorStop(0, '#9aa0a8');
    grad.addColorStop(1, '#5c626a');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 1.5; ctx.stroke();
    // Cracks
    ctx.strokeStyle = 'rgba(40,44,50,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-radius * 0.2, -radius * 0.7); ctx.lineTo(0, 0); ctx.lineTo(radius * 0.4, radius * 0.3); ctx.stroke();
  } else if (type === 'crate') {
    const s = radius;
    ctx.beginPath(); ctx.rect(-s, -s, s * 2, s * 2);
    const grad = ctx.createLinearGradient(-s, -s, s, s);
    grad.addColorStop(0, '#b8843e');
    grad.addColorStop(1, '#8a5e22');
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#5a3c14'; ctx.lineWidth = 2; ctx.stroke();
    // Planks + diagonal brace
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
    ctx.moveTo(-s, -s); ctx.lineTo(s, s);
    ctx.moveTo(s, -s); ctx.lineTo(-s, s);
    ctx.stroke();
  } else {
    // bush — clustered leafy blobs
    const blobs = [[-radius * 0.5, radius * 0.1, radius * 0.6], [radius * 0.5, radius * 0.1, radius * 0.6], [0, -radius * 0.4, radius * 0.7]];
    for (const [bx, by, br] of blobs) {
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(bx, by - br * 0.3, 1, bx, by, br);
      grad.addColorStop(0, '#4caa3a');
      grad.addColorStop(1, '#2a6e22');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = '#1e5216'; ctx.lineWidth = 1; ctx.stroke();
    }
    // Berries
    ctx.fillStyle = '#e63347';
    for (const [bx, by] of [[-radius * 0.3, 0], [radius * 0.4, -radius * 0.1], [0, radius * 0.2]]) {
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}

// Tiling garden ground tile (128x128)
export function drawGardenTile(ctx: CanvasRenderingContext2D, x: number, y: number, tileSize = 128): void {
  ctx.save();
  ctx.translate(x, y);

  // Base soil color
  ctx.fillStyle = '#4a7c2f';
  ctx.fillRect(0, 0, tileSize, tileSize);

  // Soil variation patches
  const patches = [
    { x: 20, y: 15, r: 18, color: '#3d6e28' },
    { x: 80, y: 40, r: 22, color: '#56882a' },
    { x: 50, y: 90, r: 16, color: '#3d6e28' },
    { x: 110, y: 70, r: 14, color: '#427030' },
    { x: 10, y: 90, r: 20, color: '#4a7a32' },
    { x: 95, y: 15, r: 17, color: '#3a6424' },
  ];
  for (const p of patches) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  // Grass tufts
  ctx.strokeStyle = '#5a9a35';
  ctx.lineWidth = 1.5;
  const tufts = [[30, 30], [70, 20], [100, 60], [25, 80], [60, 110], [90, 100]];
  for (const [tx, ty] of tufts) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(tx + i * 3, ty);
      ctx.quadraticCurveTo(tx + i * 5, ty - 8, tx + i * 2, ty - 12);
      ctx.stroke();
    }
  }

  // Subtle grid seam
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, tileSize, tileSize);

  ctx.restore();
}
