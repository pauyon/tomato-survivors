// Camera: tracks a target (the player), transforms world coords → screen coords.
// Screen shake is applied as a separate canvas CSS transform by the UI layer.

export class Camera {
  x = 0;       // world position of camera center
  y = 0;
  width = 0;   // viewport size in pixels
  height = 0;

  // Screen shake
  shakeIntensity = 0;
  shakeDecay = 8;   // units per second

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Smoothly follow a world position. Call once per fixed update. */
  follow(targetX: number, targetY: number, dt: number): void {
    const speed = 8;
    this.x += (targetX - this.x) * speed * dt;
    this.y += (targetY - this.y) * speed * dt;
  }

  /** Add screen shake (intensity = max pixel offset). */
  shake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(dt: number): void {
    this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
  }

  /** Returns CSS transform string for screen shake applied to the canvas element. */
  getShakeTransform(): string {
    if (this.shakeIntensity < 0.5) return '';
    const dx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    const dy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    return `translate(${dx}px, ${dy}px)`;
  }

  /** Apply world→screen transform to the canvas context. */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(
      Math.round(this.width  / 2 - this.x),
      Math.round(this.height / 2 - this.y),
    );
  }

  /** Convert world coordinates to screen coordinates. */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx - this.x + this.width  / 2,
      y: wy - this.y + this.height / 2,
    };
  }

  /** Convert screen coordinates to world coordinates. */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx + this.x - this.width  / 2,
      y: sy + this.y - this.height / 2,
    };
  }

  /** Returns the visible world rectangle. Useful for culling off-screen entities. */
  getBounds(margin = 64): { left: number; top: number; right: number; bottom: number } {
    return {
      left:   this.x - this.width  / 2 - margin,
      top:    this.y - this.height / 2 - margin,
      right:  this.x + this.width  / 2 + margin,
      bottom: this.y + this.height / 2 + margin,
    };
  }
}
