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

    forEach(func: (x: number, y: number, value: T) => void | boolean): void {
      for (const _x in this.grid) {
          const x = Number(_x);
          for (const _y in this.grid[x]) {
              const y = Number(_y);
              if (func(x, y, this.grid[x][y]) === false) {
                  return;
              }
          }
      }
  }
  }