import { usePaintToolStore } from "../stores/paintToolStore";
import { PaintToolState, PaintToolMode } from "../types/toolTypes";
import { TileMap } from "../utils/tileMap";

export class PaintTool {

    getState(): PaintToolState {
        return usePaintToolStore.getState();
    }

    paint(x: number, y: number, tileMap: TileMap){
        const state = this.getState();
        switch(state.mode){
            case PaintToolMode.Brush:
                tileMap.placeTile(x, y, state.tileType);    
            break;
            default:
                break;
        }
    }

}