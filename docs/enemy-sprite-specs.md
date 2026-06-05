# Enemy Sprite Sheet Specs

Asset spec for the four enemy types in **Tomato Survivors**. All four currently
render as procedural canvas drawings (`src/assets/placeholders/EnemySprites.ts`);
this doc describes the real sprite sheets to generate and drop in.

> **Scope:** walk/movement loop only. Hits already flash white in-engine, so no
> separate hurt frames are needed. (Death animations are out of scope for now.)

## Where the files go

Drop the finished PNGs here (paths already declared in `src/assets/manifest.ts`):

```
public/assets/sprites/enemies/rot-spore.png
public/assets/sprites/enemies/aphid.png
public/assets/sprites/enemies/caterpillar.png
public/assets/sprites/enemies/beetle.png
```

If a file is missing, the engine transparently falls back to the procedural
placeholder, so you can add them one at a time.

## Shared specs (all enemies)

- **Format:** PNG, transparent background, **horizontal strip** (frames
  left-to-right, frame 0 first).
- **Style:** pixel art to match the 32x32 player frames; limited palette, crisp
  edges. The engine renders enemies with image smoothing **OFF**, so avoid
  anti-aliased/blurry edges — they will look muddy.
- **View:** top-down 3/4 view, roughly symmetric. Enemies are **not** flipped or
  rotated by movement direction, so they must read well moving any direction.
- **Shadow:** leave it out (transparent). A contact shadow is added in-engine.
- **Frame count** is a recommendation; 2-4 each is fine. Animation metadata in
  `SPRITE_ANIMS` (manifest.ts) will be tuned to match the final deliverables.

## The four monsters

| Enemy       | File             | Frame size | Frames | Full sheet size | Hitbox diameter | Role                         |
|-------------|------------------|------------|--------|-----------------|-----------------|------------------------------|
| Rot Spore   | `rot-spore.png`  | 32x32      | 4      | **128x32**      | ~26px           | Basic, slow, early game      |
| Aphid       | `aphid.png`      | 24x24      | 4      | **96x24**       | ~16px           | Fast, fragile swarmer        |
| Caterpillar | `caterpillar.png`| 48x24      | 4      | **192x24**      | ~28px           | Medium, segmented, tanky-ish |
| Beetle      | `beetle.png`     | 40x32      | 4      | **160x32**      | ~32px           | Heavy armored tank, hits hard|

> **Full sheet size** = `frame width x frame count` wide by `frame height` tall,
> since each sheet is a single horizontal strip. If you change the frame count,
> scale the total width to match (e.g. a 3-frame Rot Spore would be 96x32).

### Rot Spore
*Stats: hp 28, speed 55, damage 15 — the default grunt.*

A rotting fungal blob. Dark brown / decayed body (`#5c3a1e` -> `#3d2410`) with a
wobbling, blobby silhouette, pale tan spore puffs popping off the surface, and
two glowing **red** eyes. Loop = gentle pulsate/wobble with spores drifting.
Gross, soft, organic.

### Aphid
*Stats: hp 10, speed 100, damage 8 — weak but comes in swarms.*

A small bright-green soft-bodied insect. Bulbous teardrop body
(`#7adf4a` -> `#2a7a10`), small round head, two antennae, tiny black dot eyes,
three pairs of skittering legs. Loop = quick frantic leg-skitter. Reads tiny and
fast.

### Caterpillar
*Stats: hp 55, speed 45, damage 18 — beefier mid-tier.*

A long segmented green grub, 4-5 round segments getting slightly smaller toward
the tail, alternating green shades (`#4ab82a` / `#5acc30`) with faint pale stripe
highlights, darker green head with black eyes + antennae. Loop = inchworm /
undulating crawl (segments rise and fall in a wave). This is the **wide** sprite —
landscape orientation.

### Beetle
*Stats: hp 120, speed 35, damage 25 — the slow heavy bruiser.*

An armored beetle. Dark iridescent **purple-blue elytra** (wing covers) with a
glossy sheen highlight (`#5a5a8e` -> `#1a1a30`), a center seam down the back, dark
head with **amber/orange glowing** eyes (`#ffaa00`), small mandibles, and six dark
legs. Loop = slow lumbering trudge with subtle leg + mandible movement. Should
feel menacing and tanky.

## After you add the sheets

The enemy sprite-sheet render path still needs wiring up (currently only the
player renders from a sheet; enemies call placeholder draw functions in
`RenderSystem.ts`). Once the PNGs are in, the remaining engine work is:

1. Load the enemy sheets via the asset loader.
2. Replace the placeholder `switch` in `RenderSystem.ts` with sheet-based frame
   drawing.
3. Set the matching `SPRITE_ANIMS` entries (frameW/frameH/frames/fps) in
   `manifest.ts`.
