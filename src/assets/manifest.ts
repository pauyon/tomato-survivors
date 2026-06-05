// Central registry of all sprite asset paths.
// To swap in real artwork: drop the PNG at the declared path inside public/.
// If the file doesn't exist the AssetLoader transparently uses the procedural placeholder.
// To update animation metadata for a spritesheet, edit SPRITE_ANIMS below.

export const SPRITES = {
  player: {
    tommyTomato: {
      idle: '/assets/sprites/player/tommy-idle.png',
      walk: '/assets/sprites/player/tommy-walk.png',
      hurt: '/assets/sprites/player/tommy-hurt.png',
    },
  },
  enemies: {
    rotSpore:    '/assets/sprites/enemies/rot-spore.png',
    aphid:       '/assets/sprites/enemies/aphid.png',
    caterpillar: '/assets/sprites/enemies/caterpillar.png',
    beetle:      '/assets/sprites/enemies/beetle.png',
  },
  weapons: {
    seed:         '/assets/sprites/weapons/seed.png',
    vine:         '/assets/sprites/weapons/vine.png',
    compostBlast: '/assets/sprites/weapons/compost-blast.png',
    pesticide:    '/assets/sprites/weapons/pesticide.png',
  },
  effects: {
    xpGem:    '/assets/sprites/effects/xp-gem.png',
    hitSpark: '/assets/sprites/effects/hit-spark.png',
    goldCoin: '/assets/sprites/effects/gold-coin.png',
  },
  tiles: {
    ground: '/assets/sprites/tiles/garden-ground.png',
  },
} as const;

export interface SpriteAnimDef {
  frameW: number;
  frameH: number;
  frames: number;
  fps: number;
  loop?: boolean;
}

// Animation metadata for spritesheets. Placeholders ignore this (they animate procedurally).
// When you provide a real spritesheet, fill in the matching entry here.
export const SPRITE_ANIMS: Record<string, SpriteAnimDef> = {
  'player.walk':       { frameW: 32, frameH: 32, frames: 4, fps: 8,  loop: true  },
  'player.idle':       { frameW: 32, frameH: 32, frames: 2, fps: 4,  loop: true  },
  'player.hurt':       { frameW: 32, frameH: 32, frames: 2, fps: 12, loop: false },
  // Pixel-art horizontal strips of 4 frames. The enemy renderer
  // (EnemySpriteRenderer.ts) derives frame geometry from the loaded image; these
  // are the per-frame pixel sizes for reference.
  'enemy.rotSpore':    { frameW: 32, frameH: 32, frames: 4, fps: 6, loop: true },
  'enemy.aphid':       { frameW: 24, frameH: 24, frames: 4, fps: 9, loop: true },
  'enemy.caterpillar': { frameW: 48, frameH: 24, frames: 4, fps: 6, loop: true },
  'enemy.beetle':      { frameW: 40, frameH: 32, frames: 4, fps: 5, loop: true },
};
