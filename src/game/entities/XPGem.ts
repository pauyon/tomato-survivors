import { Entity } from './Entity';

export class XPGem extends Entity {
  value: number;
  animTime = 0;
  // Gentle float
  floatOffset = 0;
  floatSpeed: number;

  constructor(x: number, y: number, value: number) {
    super(x, y, 6);
    this.value = value;
    this.floatSpeed = 1.5 + Math.random() * 1.5;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    this.floatOffset = Math.sin(this.animTime * this.floatSpeed) * 2;
    // Gems drift slightly toward player via XPSystem — no vx/vy by default
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

export class GoldCoin extends Entity {
  value: number;
  animTime = 0;

  constructor(x: number, y: number, value: number) {
    super(x, y, 6);
    this.value = value;
    // Brief outward pop when spawned
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 40;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number): void {
    this.savePrev();
    this.animTime += dt;
    // Slow down and stop
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}
