import { TileType } from "./tileTypes";

export enum PaintToolMode{
    Brush = "brush",
    Eraser = "eraser"
}

export interface PaintTool {
  tile: TileType;
  tileTypes: TileType[];
}