import { Vector2 } from "@babylonjs/core";
import { JunctionType, Tile, TileType } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";
import { isEqual, xor } from "lodash";

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

        const tile = this.get(x, y);

        switch (tileType) {
            case TileType.Wall:
                this.set(x, y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base});
                this.getSquare(x, y, 1).forEach((tile) => {
                    this.updateWall(tile.x, tile.y)
                    this.tileChange(tile.x, tile.y, tile.value);
                }); //3x3 area
                break;
            case TileType.Floor:
                this.set(x, y, {type: TileType.Floor});
                break;
            case TileType.Empty:
                if(this.get(x, y).type != TileType.Empty){
                    this.set(x, y, {type: TileType.Empty});
                    this.getSquare(x, y, 1).forEach((tile) => {
                        this.updateWall(tile.x, tile.y)
                        this.tileChange(tile.x, tile.y, tile.value);
                    }); //3x3 area
                }
                break;
        }

        this.tileChange(x, y, tile);
    }

    floodFill(start: Vector2, maxDepth: number, tileType: TileType, callback: (point: Vector2) => void){
        const visited = new SparseGrid(false);

        const stack = [start];
        while(stack.length > 0 && maxDepth > 0){
            const p = stack.pop()!;
            maxDepth--;

            callback(p);

            const neighbors = [{x: p.x+1, y: p.y}, {x: p.x-1, y: p.y}, {x: p.x, y: p.y+1}, {x: p.x, y: p.y-1}];

            for(const n of neighbors){ 
                if(this.getEdge(p.x, p.y, n.x, n.y) != TileType.Empty){
                    continue;
                }
                if(this.get(n.x, n.y).type == tileType && !visited.get(n.x, n.y)){
                    visited.set(n.x, n.y, true);
                    stack.push(new Vector2(n.x, n.y));
                }
            }
        }
    }

    //gets edge between tiles (x1, y1) and (x2, y2)
    private getEdge(x1: number, y1: number, x2: number, y2: number): TileType {
        const dx = x2 - x1;
        const dy = y2 - y1;

        if(Math.abs(dx)+Math.abs(dy) > 1){
            throw new Error("Tiles should be neighbors.");
        }

        // Midpoint between the two tiles (for edge calculation)
        const midX = x1 + dx * 0.5;
        const midY = y1 + dy * 0.5;

        // Check the two corners of the edge
        const corner1 = this.get(midX + dy * 0.5, midY - dx * 0.5); // Perpendicular offset 1
        const corner2 = this.get(midX - dy * 0.5, midY + dx * 0.5); // Perpendicular offset 2

        if (corner1.type == corner2.type) {
            return corner1.type;
        }
        return TileType.Empty;
    }

    private tileChange(x: number, y: number, oldTile: Tile){
        const newTile: Tile = this.get(x, y);
        if(!isEqual(oldTile, newTile)){
            this.tileChanges.set(x, y, newTile);
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