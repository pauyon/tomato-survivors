// Fixed-step game loop using requestAnimationFrame.
// Update runs at a deterministic 60 Hz; render gets an interpolation alpha
// so motion appears smooth even if the display refreshes at a different rate.

export interface GameLoopCallbacks {
  update: (dt: number) => void;
  render: (alpha: number) => void;
}

const FIXED_DT = 1 / 60;
const MAX_FRAME_TIME = 0.1; // prevents the "spiral of death" on tab unfocus

export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;
  private callbacks: GameLoopCallbacks;

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    const elapsed = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime = now;
    this.accumulator += elapsed;

    // Fixed-step updates
    while (this.accumulator >= FIXED_DT) {
      this.callbacks.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // Render with interpolation alpha so entities appear between fixed steps
    const alpha = this.accumulator / FIXED_DT;
    this.callbacks.render(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
