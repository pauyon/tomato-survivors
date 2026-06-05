// Object-pooled particle system. Particles are reused to avoid GC pressure.

interface Particle {
  alive: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number;    // 0–1 remaining life
  decay: number;   // life lost per second
  size: number;
  r: number; g: number; b: number;
  type: 'spark' | 'debris' | 'xp' | 'levelup';
}

const POOL_SIZE = 600;

export class ParticleSystem {
  private pool: Particle[] = [];

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(this.blank());
    }
  }

  private blank(): Particle {
    return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 1, size: 3, r: 255, g: 200, b: 50, type: 'spark' };
  }

  private acquire(): Particle | null {
    for (const p of this.pool) {
      if (!p.alive) return p;
    }
    return null; // pool exhausted
  }

  private emit(x: number, y: number, vx: number, vy: number, life: number, size: number, r: number, g: number, b: number, type: Particle['type']): void {
    const p = this.acquire();
    if (!p) return;
    p.alive = true; p.x = x; p.y = y;
    p.vx = vx; p.vy = vy;
    p.life = 1; p.decay = 1 / life;
    p.size = size; p.r = r; p.g = g; p.b = b;
    p.type = type;
  }

  spawnHit(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.25 + Math.random() * 0.2, 2 + Math.random() * 2, 255, 220, 50, 'spark');
    }
  }

  spawnDeath(x: number, y: number, r: number, g: number, b: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.4 + Math.random() * 0.3, 3 + Math.random() * 4, r, g, b, 'debris');
    }
  }

  spawnXPCollect(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.3, 3, 80, 240, 255, 'xp');
    }
  }

  spawnLevelUp(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.6 + Math.random() * 0.4, 4 + Math.random() * 5, 255, 220, 60, 'levelup');
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.life -= p.decay * dt;
      if (p.life <= 0) { p.alive = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.88, dt * 60); // drag
      p.vy *= Math.pow(0.88, dt * 60);
      if (p.type === 'debris') p.vy += 80 * dt; // gravity
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.alive) continue;
      ctx.save();
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
