import { TileType } from "./tileTypes";

export enum PaintToolType{
    Brush = "brush",
    Eraser = "eraser"
}

export interface PaintTool {
  activeTool: PaintToolType;
  selectedTile: TileType;
  tileTypes: TileType[];
}