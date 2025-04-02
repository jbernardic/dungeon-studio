export class SparseGrid<T = number> {
  private grid: Map<number, Map<number, T>> = new Map();
  private defaultValue: T;

  constructor(defaultValue: T) {
      this.defaultValue = defaultValue;
  }

  // resets tile to default value
  reset(x: number, y: number): void {
      this.grid.get(x)?.delete(y);
  }

  get(x: number, y: number): T {
      const row = this.grid.get(x);
      return row?.get(y) ?? this.defaultValue;
  }

  set(x: number, y: number, value: T): void {
      let row = this.grid.get(x);
      if(!row){
        row = new Map();
        this.grid.set(x, row)
      }
      row.set(y, value);
  }

  // get a square of tiles centered on (x, y) with the specified size
  getSquare(x: number, y: number, size: number): { x: number, y: number, value: T }[] {
      const square: { x: number, y: number, value: T }[] = [];
      for (let i = x - size; i <= x + size; i++) {
          for (let j = y - size; j <= y + size; j++) {
              square.push({ x: i, y: j, value: this.get(i, j) });
          }
      }
      return square;
  }

  // get the neighboring tiles of (x, y)
  getNeighbors(x: number, y: number): { x: number, y: number, value: T }[] {
      const neighbors: { x: number, y: number, value: T }[] = [
          { x: x - 1, y: y, value: this.get(x - 1, y) }, // left
          { x: x + 1, y: y, value: this.get(x + 1, y) }, // right
          { x: x, y: y - 1, value: this.get(x, y - 1) }, // up
          { x: x, y: y + 1, value: this.get(x, y + 1) }  // down
      ];
      return neighbors;
  }

  // get all tiles in the grid
  getAll(): { x: number, y: number, value: T }[] {
      const all: { x: number, y: number, value: T }[] = [];
      for (const [x, row] of this.grid.entries()) {
          for (const [y, value] of row.entries()) {
              all.push({ x, y, value });
          }
      }
      return all;
  }

  // clears the entire grid
  clear(): void {
      this.grid.clear();
  }
}
