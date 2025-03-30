import { Vector3 } from "@babylonjs/core";
import { JunctionType, Tile, TileType, WallTile } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";
import { isEqual } from "lodash"

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
    placeTile(x: number, y: number, tileType: TileType): void {

        const oldTiles = this.getSquare(x, y, 2); //5x5 area

        switch (tileType) {
            case TileType.Wall:
                this.set(x, y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base, tiedToFloor: false});
                break;
            case TileType.Floor:
                this.set(x, y, {type: TileType.Floor});
                break;
            case TileType.Empty:
                this.set(x, y, {type: TileType.Empty});
                break;
        }

        this.getSquare(x, y, 2).forEach((tile) => this.updateFloor(tile.x, tile.y)); //5x5 area
        this.getSquare(x, y, 2).forEach((tile) => this.removeUntiedWalls(tile.x, tile.y)); //5x5 area
        this.getSquare(x, y, 2).forEach((tile) => this.updateWall(tile.x, tile.y)); //5x5 area

        let changeCount = 0;
        for(const tile of oldTiles) {
            if(!isEqual(tile.value, this.get(tile.x, tile.y))) {
                this.onTileChange.forEach((callback) => callback(tile.x, tile.y, this.get(tile.x, tile.y)));
                changeCount++;
            }
        }
        console.log(`TileMap: ${changeCount} tiles changed`);
    }

    //removes walls that are not tied to a floor but were previously
    private removeUntiedWalls(x: number, y: number) {
        const {i, j} = {i: x, j: y};
        const tiedToFloor = this.get(i, j + 1).type == TileType.Floor ||
            this.get(i, j - 1).type == TileType.Floor ||
            this.get(i - 1, j).type == TileType.Floor ||
            this.get(i + 1, j).type == TileType.Floor ||
            this.get(i - 1, j + 1).type == TileType.Floor ||
            this.get(i + 1, j + 1).type == TileType.Floor ||
            this.get(i - 1, j - 1).type == TileType.Floor ||
            this.get(i + 1, j - 1).type == TileType.Floor;

        if((this.get(i, j) as WallTile).tiedToFloor && !tiedToFloor) {
            this.set(i, j, { type: TileType.Empty });
        }
    }

    //adds surrounding walls if the tile is a floor
    private updateFloor(x: number, y: number) {
        if(this.get(x, y).type != TileType.Floor) return; //skip if not a floor
        this.getSquare(x, y, 1).forEach((tile) => {
            if (tile.value.type == TileType.Empty) {
                this.set(tile.x, tile.y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base, tiedToFloor: true});
            }
        });
    }

    //updates wall direction and junction info
    private updateWall(x: number, y: number) {
        const {i, j} = {i: x, j: y};
        if(this.get(i, j).type != TileType.Wall) return; //skip if not a wall

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

        const tiedToFloor = this.get(i, j + 1).type == TileType.Floor ||
            this.get(i, j - 1).type == TileType.Floor ||
            this.get(i - 1, j).type == TileType.Floor ||
            this.get(i + 1, j).type == TileType.Floor ||
            this.get(i - 1, j + 1).type == TileType.Floor ||
            this.get(i + 1, j + 1).type == TileType.Floor ||
            this.get(i - 1, j - 1).type == TileType.Floor ||
            this.get(i + 1, j - 1).type == TileType.Floor;

        this.set(i, j, { type: TileType.Wall, junction, direction: direction, tiedToFloor });
    }
}