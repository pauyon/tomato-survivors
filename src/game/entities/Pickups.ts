import { Entity } from './Entity';

/** A heart that heals the player when collected. Drifts like a coin, magnet-able. */
export class HealthDrop extends Entity {
  value: number; // HP restored
  animTime = 0;

  constructor(x: number, y: number, value: number) {
    super(x, y, 7);
    this.value = value;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 40;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

/** A treasure chest. Walking onto it opens a reward (gold + a random upgrade). */
export class TreasureChest extends Entity {
  animTime = 0;

  constructor(x: number, y: number) {
    super(x, y, 13);
    // Small outward pop on spawn, then settles in place.
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 30;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    this.vx *= Math.pow(0.86, dt * 60);
    this.vy *= Math.pow(0.86, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}
