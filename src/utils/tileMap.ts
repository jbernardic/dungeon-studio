import { Vector2 } from "@babylonjs/core";
import { JunctionType, Tile, TileType, WallTile } from "../types/tileTypes";
import { SparseGrid } from "./sparseGrid";
import { isEqual } from "lodash"

export class TileMap extends SparseGrid<Tile> {
    readonly tileChanges: SparseGrid<Tile> = new SparseGrid<Tile>({type: TileType.Empty});

    constructor() {
        super({ type: TileType.Empty });
    }

    pollTileChanges() {
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

        const oldTiles = this.getSquare(x, y, 2); //5x5 area

        switch (tileType) {
            case TileType.Wall:
                this.set(x, y, {type: TileType.Wall, direction: 0, junction: JunctionType.Base, tiedToFloor: false});
                this.getEnclosedArea(this.getEnclosedWalls(x, y)).forEach(v =>{ //flood fill with floor tiles
                    this.placeTile(v.x, v.y, TileType.Floor);
                })
                break;
            case TileType.Floor:
                this.set(x, y, {type: TileType.Floor});
                this.updateFloor(x, y); //surround with walls
                break;
            case TileType.Empty:
                const type = this.get(x, y).type;
                if(type == TileType.Wall){ //flood empty floor tiles
                    const walls = this.getEnclosedWalls(x, y);
                    this.getEnclosedArea(walls).forEach(v =>{
                        this.placeTile(v.x, v.y, TileType.Empty);
                    })

                }
                this.set(x, y, {type: TileType.Empty});
                break;
        }

        
        //TODO - fix this
        //this.getSquare(x, y, 2).forEach((tile) => this.updateFloor(tile.x, tile.y));
        //this.getSquare(x, y, 2).forEach((tile) => this.removeUntiedWall(tile.x, tile.y));
        this.getSquare(x, y, 2).forEach((tile) => this.updateWall(tile.x, tile.y)); //5x5 area

        for(const tile of oldTiles) {
            if(!isEqual(tile.value, this.get(tile.x, tile.y))) {
                this.tileChanges.set(tile.x, tile.y, this.get(tile.x, tile.y));
            }
        }
    }

    private floodFill(start: Vector2, polygon: Vector2[], callback: (point: Vector2) => void){
        const grid = new SparseGrid(false);
        for(const vert of polygon){
            grid.set(vert.x, vert.y, true);
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


    private isPointInPolygon(point: Vector2, polygon: Vector2[]): boolean {
        const { x, y } = point;
        let inside = false;
        const n = polygon.length;
    
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const { x: xi, y: yi } = polygon[i];
            const { x: xj, y: yj } = polygon[j];
    
            // Check if point is exactly on an edge (optional).
            const onEdge = yi === yj && yi === y && x >= Math.min(xi, xj) && x <= Math.max(xi, xj);
            if (onEdge) return false; // Or `true` if boundary counts as inside.
    
            // Ray intersection check.
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private getEnclosedArea(walls: Vector2[]): Vector2[]{
        const area: Vector2[] = [];
        const visited: Set<string> = new Set();
        for(const wall of walls){
            for(const neigh of this.getNeighbors(wall.x, wall.y)){
                if(this.get(neigh.x, neigh.y).type != TileType.Wall){
                    if(!visited.has(`${neigh.x},${neigh.y}`) && this.isPointInPolygon(new Vector2(neigh.x, neigh.y), walls)){
                        this.floodFill(new Vector2(neigh.x, neigh.y), walls, (point)=>{
                            const pointKey = `${point.x},${point.y}`;
                            if(!visited.has(pointKey)){
                                area.push(point);
                                visited.add(pointKey);
                            }
                        })
                        return area;
                        
                    }
                }
            }
        }
        return area;
    }

    private getEnclosedWalls(_x: number, _y: number): Vector2[] {

        type Node = {x: number, y: number, parent: Node | null};

        const stack: Node[] = [];
        const visited = new Set<string>();
        
        stack.push({x: _x, y: _y, parent: null});
        
        while (stack.length > 0) {
            const {x, y, parent } = stack.pop()!;

            const key = `${x},${y}`;
            const parentKey = parent ? `${parent.x},${parent.y}` : "";
            visited.add(key);

            for (const neighbor of this.getNeighbors(x, y)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (neighbor.value.type == TileType.Wall) {

                    if(neighborKey != parentKey && neighborKey == `${_x},${_y}`) {

                        const walls: Vector2[] = [];
                        let head: Node | null = {x: neighbor.x, y: neighbor.y, parent: {x, y, parent}};
                        do{
                            walls.push(new Vector2(head.x, head.y));
                            head = head.parent;
                        }
                        while(head != null);
                        return walls;
                    }

                    if (!visited.has(neighborKey)) {
                        stack.push({x: neighbor.x, y: neighbor.y, parent: {x, y, parent}});
                    }
                }
            }
        }
        return [];
    }

    //removes walls that are not tied to a floor but were previously
    private removeUntiedWall(x: number, y: number) {
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

    //surround floor tile with walls
    private updateFloor(x: number, y: number){
        if(this.get(x, y).type != TileType.Floor) return;
        this.getSquare(x, y, 1).forEach((tile) => { //surround with walls
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