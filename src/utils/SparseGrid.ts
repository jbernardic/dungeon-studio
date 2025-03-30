export class SparseGrid<T = number> { 
    private grid: { [x: number]: { [y: number]: T } } = {};
    private defaultValue: T;

    constructor(defaultValue: T){
      this.defaultValue = defaultValue;
    }

    private initCell(x: number, y: number): void {
      if (!(x in this.grid)) this.grid[x] = {};
      if (!(y in this.grid[x])) this.grid[x][y] = this.defaultValue;
    }
    
    //resets tile to default value
    reset(x: number, y: number) {
      this.grid[x][y] = this.defaultValue;
    }

    get(x: number, y: number): T {
      x = Math.floor(x);
      y = Math.floor(y);
      this.initCell(x, y);
      return this.grid[x][y];
    }
  
    set(x: number, y: number, value: T): void {
      x = Math.floor(x);
      y = Math.floor(y);
      this.initCell(x, y);
      this.grid[x][y] = value;
    }
    
    // size is the distance from the center to the edge of the square
    getSquare(x: number, y: number, size: number): {x: number, y: number, value: T}[] {
      const square: {x: number, y: number, value: T}[] = [];
      for (let i = x-size; i <= x + size; i++) {
        for (let j = y-size; j <= y + size; j++) {
          square.push({x: i, y: j, value: this.get(i, j)});
        }
      }
      return square;
    }

    getAll(): {x: number, y: number, value: T}[] {
      const all: {x: number, y: number, value: T}[] = [];
      for (const x in this.grid) {
        for (const y in this.grid[x]) {
          all.push({x: parseInt(x), y: parseInt(y), value: this.grid[x][y]});
        }
      }
      return all;
    }
  }