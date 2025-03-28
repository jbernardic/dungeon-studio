import { create } from "zustand";
import {TileType } from "../types/tileTypes";
import { PaintTool } from "../types/toolTypes";

export const usePaintToolStore = create<Readonly<PaintTool>>(() => ({
  tile: TileType.Floor,
  tileTypes: Object.values(TileType)
}));
