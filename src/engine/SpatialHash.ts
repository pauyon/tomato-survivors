// Grid-based spatial hash for broad-phase collision detection.
// Reduces N² checks to roughly O(N) for evenly distributed entities.

export interface HasPosition {
  x: number;
  y: number;
  radius: number;
}

export class SpatialHash<T extends HasPosition> {
  private cells = new Map<number, T[]>();
  private readonly cellSize: number;

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): number {
    // Cantor pairing — works for any integer coords including negatives
    const a = cx >= 0 ? cx * 2 : cx * -2 - 1;
    const b = cy >= 0 ? cy * 2 : cy * -2 - 1;
    return ((a + b) * (a + b + 1)) / 2 + b;
  }

  private cellCoords(x: number, y: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  clear(): void {
    this.cells.clear();
  }

  insert(entity: T): void {
    const [cx, cy] = this.cellCoords(entity.x, entity.y);
    const k = this.key(cx, cy);
    let cell = this.cells.get(k);
    if (!cell) { cell = []; this.cells.set(k, cell); }
    cell.push(entity);
  }

  /** Returns all entities in cells overlapping the given circle. May include duplicates if entity spans cells. */
  query(x: number, y: number, radius: number): T[] {
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    const result: T[] = [];
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) result.push(...cell);
      }
    }
    return result;
  }

  /** Rebuild the entire hash from an array of entities. Cheap — just clears and re-inserts. */
  rebuild(entities: T[]): void {
    this.clear();
    for (const e of entities) this.insert(e);
  }
}
