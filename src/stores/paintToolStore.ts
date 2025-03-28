import { create } from "zustand";
import {TileType } from "../types/tileTypes";
import { PaintToolType, PaintTool } from "../types/toolTypes";

export interface PaintToolState extends Readonly<PaintTool> {
    setActiveTool: (tool: PaintToolType) => void;
    setSelectedTile: (tile: TileType) => void;
}

export const usePaintToolStore = create<PaintToolState>((set) => ({
  activeTool: PaintToolType.Brush,
  selectedTile: TileType.Floor,
  tileTypes: Object.values(TileType),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedTile: (tile) => set({ selectedTile: tile }),
}));
