export enum TileType{
    Floor = "floor",
    Wall = "wall"
}

export enum JunctionType {
    Base,
    T0,
    T1,
    T2,
    T3,
    T4
}

export interface FloorTile {
    type: TileType.Floor;
}

export interface WallTile {
    type: TileType.Wall;
    direction: number;
    junction: JunctionType;
}

export type Tile = FloorTile | WallTile;