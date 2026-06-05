// Singleton keyboard input manager.
// Poll `input.moveX` / `input.moveY` each frame — normalized [-1, 1].

class InputManager {
  private keys = new Set<string>();
  private bound = false;

  bind(): void {
    if (this.bound) return;
    this.bound = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    // Prevent arrow keys from scrolling the page
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  unbind(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.bound = false;
    this.keys.clear();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  get moveX(): number {
    const left  = this.isDown('a') || this.isDown('arrowleft')  ? -1 : 0;
    const right = this.isDown('d') || this.isDown('arrowright') ?  1 : 0;
    return left + right;
  }

  get moveY(): number {
    const up   = this.isDown('w') || this.isDown('arrowup')   ? -1 : 0;
    const down = this.isDown('s') || this.isDown('arrowdown') ?  1 : 0;
    return up + down;
  }

  /** Returns a normalized movement vector (magnitude ≤ 1). */
  getMovement(): { x: number; y: number } {
    const x = this.moveX;
    const y = this.moveY;
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  }
}

export const input = new InputManager();
