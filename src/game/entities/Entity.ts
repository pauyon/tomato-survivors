let nextId = 1;

export abstract class Entity {
  readonly id: number;
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  alive = true;
  radius: number;

  // Previous position for render interpolation
  prevX: number;
  prevY: number;

  constructor(x: number, y: number, radius: number) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.radius = radius;
  }

  /** Store previous position before physics update (used for render interpolation). */
  savePrev(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** Get interpolated render position. alpha=0 → prev, alpha=1 → current. */
  renderPos(alpha: number): { x: number; y: number } {
    return {
      x: this.prevX + (this.x - this.prevX) * alpha,
      y: this.prevY + (this.y - this.prevY) * alpha,
    };
  }

  distanceTo(other: Entity): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceToPoint(px: number, py: number): number {
    const dx = this.x - px;
    const dy = this.y - py;
    return Math.sqrt(dx * dx + dy * dy);
  }

  overlaps(other: Entity): boolean {
    return this.distanceTo(other) < this.radius + other.radius;
  }
}
