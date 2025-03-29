import { Vector3 } from "@babylonjs/core";
import { JunctionType, Tile, TileType } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";

export class TileMap extends SparseGrid<Tile> {

    readonly onTileChange: ((x: number, y: number, tile: Tile) => void)[] = [];

    constructor() {
        super({ type: TileType.Empty });
    }


    // Gets tiles in a square area around the given location
    // with the specified render distance.
    getVisibleTiles(location: Vector3, renderDistance: number): { tile: Tile, x: number, y: number }[] {
        const center = location.floor();
        const tiles = [];
        for (let i = center.x - renderDistance; i <= center.x + renderDistance; ++i) {
            for (let j = center.z - renderDistance; j <= center.z + renderDistance; ++j) {
                tiles.push({
                    tile: this.get(i, j),
                    x: i,
                    y: j,
                });
            }
        }
        return tiles;
    }

    // Sets a tile at the specified coordinates.
    // If the tile is a floor, it will also add surrounding walls.
    // If the tile is empty, it will remove surrounding walls if the replaced tile is a floor.
    // It will also update the wall direction and junction info for surrounding walls.
    paintTile(x: number, y: number, tileType: TileType): void {
        switch (tileType) {
            case TileType.Wall:
                this.set(x, y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base});
                break;
            case TileType.Floor:
                this.set(x, y, {type: TileType.Floor});

                //surrounding walls
                this.getSquare(x, y, 1).forEach((tile) => {
                    if (tile.value.type == TileType.Empty) {
                        this.paintTile(tile.x, tile.y, TileType.Wall);
                    }
                });
                break;
            case TileType.Empty:
                const type = this.get(x, y).type;
                this.set(x, y, {type: TileType.Empty});
                //remove surrounding walls if replaced tile is a floor
                if(type == TileType.Floor) {
                    //remove surrounding walls
                    this.getSquare(x, y, 1).forEach((tile) => {
                        if(tile.x == x && tile.y == y) return; //skip self
                        if (tile.value.type == TileType.Wall) {
                            this.paintTile(tile.x, tile.y, TileType.Empty);
                        }
                    });
                    //repaint surrounding floors
                    this.getSquare(x, y, 2).forEach((tile) => {
                        if(tile.x == x && tile.y == y) return; //skip self
                        if(tile.value.type == TileType.Floor){
                            this.paintTile(tile.x, tile.y, TileType.Floor);
                        }
                    });
                }
                
                break;
        }

        this.getSquare(x, y, 1).forEach((tile) => { //3x3 area
            if (tile.value.type == TileType.Wall) {
                this.updateWall(tile.x, tile.y);
            }
            this.onTileChange.forEach((callback) => {
                callback(tile.x, tile.y, this.get(tile.x, tile.y));
            });
        });
    }

    //updates wall direction and junction info
    private updateWall(x: number, y: number) {
        const {i, j} = {i: x, j: y};
        if(this.get(i, j).type != TileType.Wall) throw new Error("Tile is not a wall type.");

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