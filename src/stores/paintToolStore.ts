import { create } from "zustand";
import {TileType } from "../types/tileTypes";
import { PaintToolState, PaintToolMode } from "../types/toolTypes";

export const usePaintToolStore = create<Readonly<PaintToolState>>(() => ({
  tileType: TileType.Floor,
  mode: PaintToolMode.Brush
}));
