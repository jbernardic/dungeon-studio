import { Color3, Color4, Vector2 } from "@babylonjs/core";
import { JunctionType, Tile, TileType } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";
import { isEqual } from "lodash";

export class TileMap extends SparseGrid<Tile> {

    private tileChanges: SparseGrid<Tile> = new SparseGrid<Tile>({type: TileType.Empty});
    private tileHistory: SparseGrid<Tile>[] = [];
    private tileFuture: SparseGrid<Tile>[] = [];

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
    placeTile(x: number, y: number, tileType: TileType, clearTileFuture: boolean = true): void {
        this.tileHistory.push(this.clone());
        if(clearTileFuture) this.tileFuture = [];
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

    undo(){
        const historyTiles = this.tileHistory.pop();
        if(historyTiles){
            this.tileFuture.push(this.clone());
            for(const tile of this.getAll()){
                const historyTile = historyTiles.get(tile.x, tile.y);
                if(tile.value.type != historyTile.type){
                    this.placeTile(tile.x, tile.y, historyTile.type, false);
                    this.tileHistory.pop();
                }
            }
        }
    }

    redo(){
        const futureTiles = this.tileFuture.pop();
        if(futureTiles){
            for(const tile of this.getAll()){
                const futureTile = futureTiles.get(tile.x, tile.y);
                if(tile.value.type != futureTile.type){
                    this.placeTile(tile.x, tile.y, futureTile.type, false);
                }
            }
        }
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

    getImageData(colorMap: Map<TileType, Color3 | Color4>, emptyEdgeColor: Color3 | Color4 = Color3.Black()): { data: (Color3 | Color4)[], width: number, height: number } | null {
        const data: (Color3 | Color4)[] = [];
    
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
    
        for (const tile of this.getAll()) {
            const x2 = tile.x * 2;
            const y2 = tile.y * 2;
            minX = Math.min(minX, x2);
            minY = Math.min(minY, y2);
            maxX = Math.max(maxX, x2);
            maxY = Math.max(maxY, y2);
        }
    
        if (minX === Infinity || minY === Infinity) return null;
    
        // Add padding to allow edge pixels
        minX -= 4;
        minY -= 4;
        maxX += 4;
        maxY += 4;
    
        const sizeX = maxX - minX + 1;
        const sizeY = maxY - minY + 1;
    
        const colorOf = (tileType: TileType) => colorMap.get(tileType) ?? Color3.Purple();
        data.length = sizeX * sizeY;
        data.fill(colorOf(TileType.Empty), 0, sizeX * sizeY);
    
        for (const tile of this.getAll()) {

            const px = Math.round(tile.x * 2) - minX;
            const py = Math.round(tile.y * 2) - minY;
            const flippedY = sizeY - py - 1;
    
            data[flippedY * sizeX + px] = colorOf(tile.value.type);

            //draw edge tiles
            if(Number.isInteger(tile.x) && Number.isInteger(tile.y)){
                for(const n of [{x: 1, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}, {x: 0, y: 1}]){
                    
                    const edgeType = this.getEdge(tile.x, tile.y, tile.x+n.x, tile.y+n.y);
                    let edgeColor = colorOf(edgeType);
                    if(edgeType == TileType.Empty) edgeColor = emptyEdgeColor;

                    data[(flippedY-n.y) * sizeX + px + n.x] = edgeColor;

                    if(n.x != 0){
                        data[(flippedY-n.y+1) * sizeX + px + n.x] = edgeColor;
                        data[(flippedY-n.y-1) * sizeX + px + n.x] = edgeColor;
                    }
                    else if(n.y != 0){
                        data[(flippedY-n.y) * sizeX + px + n.x+1] = edgeColor;
                        data[(flippedY-n.y) * sizeX + px + n.x-1] = edgeColor;
                    }
                }
            }

        }
    
        return { data, width: sizeX, height: sizeY };
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
            direction = 3;
        }
        else if (!tN && tW && !tE && !tS){
            junction = JunctionType.T1;
            direction = 1;
        }
        else if(tN && !tW && !tE && !tS){
            junction = JunctionType.T1;
            direction = 0;
        }
        //T2
        else if (tN && tW && !tE && !tS) {
            junction = JunctionType.T2;
            direction = 1;
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
            direction = 3;
        }
        //T3
        else if (tN && tW && tE && !tS) {
            junction = JunctionType.T3;
            direction = 1;
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
            direction = 3;
        }
        //T4
        else if (tN && tW && tE && tS){
            junction = JunctionType.T4;
            direction = 0;
        }

        this.set(i, j, { type: TileType.Wall, junction, direction: direction });
    }
}