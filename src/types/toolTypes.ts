import { TileType } from "./tileTypes";

export enum PaintToolMode{
    Brush = "brush",
    Bucket = "bucket"
}

export interface PaintToolState {
  tileType: TileType;
  mode: PaintToolMode;
}