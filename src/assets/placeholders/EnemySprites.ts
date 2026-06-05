// Procedural placeholder sprites for all enemy types.

export type EnemyType = 'rotSpore' | 'aphid' | 'caterpillar' | 'beetle';

export function drawRotSpore(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);

  const wobble = Math.sin(t * 3) * 1.5;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 13, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();

  // Body (dark brown blob)
  ctx.save();
  ctx.translate(0, wobble);
  ctx.beginPath();
  const r = 12;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const blobR = r + Math.sin(angle * 3 + t * 2) * 2.5;
    const px = Math.cos(angle) * blobR;
    const py = Math.sin(angle) * blobR;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const bodyGrad = ctx.createRadialGradient(0, -3, 1, 0, 0, r);
  bodyGrad.addColorStop(0, '#8b5e3c');
  bodyGrad.addColorStop(0.7, '#5c3a1e');
  bodyGrad.addColorStop(1, '#3d2410');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spore puffs
  const sporePositions = [[-7, -8], [7, -9], [0, -13], [-5, 6], [7, 5]];
  for (const [sx, sy] of sporePositions) {
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5 + Math.sin(t * 2 + sx) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160,120,80,0.7)';
    ctx.fill();
  }

  // Eyes (glowing red)
  ctx.beginPath(); ctx.arc(-3.5, -1, 2, 0, Math.PI * 2);
  ctx.beginPath(); ctx.arc(3.5, -1, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2200';
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

export function drawAphid(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);

  const legWiggle = Math.sin(t * 8) * 2;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 8, 5, 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#2a6e2a';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    const lx = i * 3;
    ctx.beginPath();
    ctx.moveTo(lx, 2);
    ctx.lineTo(lx - 4, 6 + legWiggle * (i === 0 ? 0 : 1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, 2);
    ctx.lineTo(lx + 4, 6 + legWiggle * (i === 0 ? 0 : -1));
    ctx.stroke();
  }

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
  grad.addColorStop(0, '#7adf4a');
  grad.addColorStop(0.6, '#4ab82a');
  grad.addColorStop(1, '#2a7a10');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#1e5a0a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(0, -8, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#5ac828';
  ctx.fill();
  ctx.stroke();

  // Antennae
  ctx.strokeStyle = '#1e5a0a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-2, -11); ctx.lineTo(-5, -16);
  ctx.moveTo(2, -11);  ctx.lineTo(5, -16);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-2, -8, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -8, 1.2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export function drawCaterpillar(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, segmentOffsets?: number[]): void {
  ctx.save();
  ctx.translate(x, y);

  const segments = segmentOffsets ?? [0, -14, -28, -42, -56];
  const amplitude = 6;

  for (let i = segments.length - 1; i >= 0; i--) {
    const sx = segments[i];
    const sy = Math.sin(t * 3 + i * 0.8) * amplitude;
    const r = i === 0 ? 9 : 7;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    const green = i === 0 ? '#3a9e3a' : (i % 2 === 0 ? '#4ab82a' : '#5acc30');
    ctx.fillStyle = green;
    ctx.fill();
    ctx.strokeStyle = '#1e6a10';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Stripe on body segments
    if (i > 0) {
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fill();
    }
  }

  // Head features (first segment at segments[0])
  const hx = segments[0];
  const hy = Math.sin(t * 3) * amplitude;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(hx - 3, hy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 3, hy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
  // Antennae
  ctx.strokeStyle = '#1e6a10'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 8); ctx.lineTo(hx - 4, hy - 14);
  ctx.moveTo(hx + 2, hy - 8); ctx.lineTo(hx + 4, hy - 14);
  ctx.stroke();

  ctx.restore();
}

export function drawBeetle(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.save();
  ctx.translate(x, y);

  const pulse = Math.sin(t * 2) * 0.5;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, 15, 12, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1.5;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const ly = -4 + i * 5;
      const legWiggle = Math.sin(t * 6 + i * 1.2 + side) * 1.5;
      ctx.beginPath();
      ctx.moveTo(side * 10, ly);
      ctx.lineTo(side * 17, ly + 5 + legWiggle);
      ctx.stroke();
    }
  }

  // Elytra (wing covers) — two halves
  ctx.save();
  const sheen = ctx.createLinearGradient(-12, -14, 12, 14);
  sheen.addColorStop(0, '#3a3a5c');
  sheen.addColorStop(0.3, '#5a5a8e');
  sheen.addColorStop(0.7, '#2a2a4a');
  sheen.addColorStop(1, '#1a1a30');

  // Left wing
  ctx.beginPath();
  ctx.ellipse(-5, 0, 8, 13, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right wing
  ctx.beginPath();
  ctx.ellipse(5, 0, 8, 13, 0.1, 0, Math.PI * 2);
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.stroke();

  // Center seam
  ctx.beginPath();
  ctx.moveTo(0, -13); ctx.lineTo(0, 13);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Sheen highlight
  ctx.beginPath();
  ctx.ellipse(-5, -5, 3, 6, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(150,150,220,${0.15 + pulse * 0.05})`;
  ctx.fill();

  ctx.restore();

  // Head
  ctx.beginPath();
  ctx.ellipse(0, -14, 7, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2a4a';
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eyes (glowing amber)
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath(); ctx.arc(-4, -14, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -14, 2, 0, Math.PI * 2); ctx.fill();

  // Mandibles
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, -18); ctx.lineTo(-6, -22);
  ctx.moveTo(3, -18);  ctx.lineTo(6, -22);
  ctx.stroke();

  ctx.restore();
}
