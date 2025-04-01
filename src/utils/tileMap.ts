import { Vector2 } from "@babylonjs/core";
import { JunctionType, Tile, TileType } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";
import { isEqual } from "lodash";

export class TileMap extends SparseGrid<Tile> {

    private tileChanges: SparseGrid<Tile> = new SparseGrid<Tile>({type: TileType.Empty});

    constructor() {
        super({ type: TileType.Empty });
    }

    pollChanges() {
        const changes = this.tileChanges.getAll();
        console.log(`TileMap: ${changes.length} tile changes`);
        this.tileChanges.clear(); //clear the tile changes after polling
        return changes;
    }


    // Sets a tile at the specified coordinates.
    // If the tile is a floor, it will also add surrounding walls.
    // If the tile is empty, it will remove surrounding walls if the replaced tile is a floor.
    // It will also update the wall direction and junction info for surrounding walls.
    placeTile(x: number, y: number, tileType: TileType): void {
        
        const oldTiles = this.getSquare(x, y, 1); //3x3 area

        switch (tileType) {
            case TileType.Wall:
                this.set(x, y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base});
                break;
            case TileType.Floor:
                this.set(x, y, {type: TileType.Floor});
                break;
            case TileType.Empty:
                this.set(x, y, {type: TileType.Empty});
                break;
        }

        this.getSquare(x, y, 1).forEach((tile) => this.updateWall(tile.x, tile.y)); //3x3 area
        oldTiles.filter((tile)=>!isEqual(tile.value, this.get(tile.x, tile.y)))
        .forEach(tile=>this.tileChanges.set(tile.x, tile.y, this.get(tile.x, tile.y)));
    }

    floodFill(start: Vector2, maxSize: number, boundType: TileType, callback: (point: Vector2) => void){
        const grid = new SparseGrid(false);
        
        for(let i = start.x-maxSize; i<=start.x+maxSize; ++i){
            for(let j = start.y-maxSize; j<=start.y+maxSize; ++j){
                if(this.get(i, j).type == boundType){
                    grid.set(i, j, true);
                }
            }
        }

        const stack = [start];
        while(stack.length > 0){
            const current = stack.pop()!;
            callback(current);
            for(const n of grid.getNeighbors(current.x, current.y)){
                if(n.value == false){
                    const point = new Vector2(n.x, n.y);
                    stack.push(point);
                    grid.set(n.x, n.y, true);
                }
            }
        }
    }

    //updates wall direction and junction info
    private updateWall(x: number, y: number) {
        const {i, j} = {i: x, j: y};
        const tile = this.get(i, j);
        if(tile.type != TileType.Wall) return; //skip if not a wall

        const tN = this.get(i, j + 1)?.type == TileType.Wall;
        const tS = this.get(i, j - 1)?.type == TileType.Wall;
        const tW = this.get(i - 1, j)?.type == TileType.Wall;
        const tE = this.get(i + 1, j)?.type == TileType.Wall;
        
        let junction = JunctionType.T0; //T0 (wall with no connection)
        let direction = 0;
        //Base (horizontal wall)
        if (tN && tS && !tW && !tE) {
            junction = JunctionType.Base;
            direction = 0;
        }
        else if (tW && tE && !tN && !tS) {
            junction = JunctionType.Base;
            direction = 1;
        }
        //T1
        else if (!tN && !tW && !tE && tS){
            junction = JunctionType.T1;
            direction = 2;
        }
        else if(!tN && !tW && tE && !tS){
            junction = JunctionType.T1;
            direction = 1;
        }
        else if (!tN && tW && !tE && !tS){
            junction = JunctionType.T1;
            direction = 3;
        }
        else if(tN && !tW && !tE && !tS){
            junction = JunctionType.T1;
            direction = 0;
        }
        //T2
        else if (tN && tW && !tE && !tS) {
            junction = JunctionType.T2;
            direction = 3;
        }
        else if (tN && tE && !tW && !tS) {
            junction = JunctionType.T2;
            direction = 0;
        }
        else if (tS && tW && !tE && !tN) {
            junction = JunctionType.T2;
            direction = 2;
        }
        else if (tS && tE && !tW && !tN) {
            junction = JunctionType.T2;
            direction = 1;
        }
        //T3
        else if (tN && tW && tE && !tS) {
            junction = JunctionType.T3;
            direction = 3;
        }
        else if (tN && tW && !tE && tS) {
            junction = JunctionType.T3;
            direction = 2;
        }
        else if (tN && !tW && tE && tS) {
            junction = JunctionType.T3;
            direction = 0;
        }
        else if (!tN && tW && tE && tS) {
            junction = JunctionType.T3;
            direction = 1;
        }
        //T4
        else if (tN && tW && tE && tS){
            junction = JunctionType.T4;
            direction = 0;
        }

        this.set(i, j, { type: TileType.Wall, junction, direction: direction });
    }
}