import { Vector2 } from "@babylonjs/core";
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
            case PaintToolMode.Bucket:
                const tiles: {x: number, y:number}[] = [];
                const floodDepth = 400;
                tileMap.floodFill(new Vector2(x, y), floodDepth, tileMap.get(x, y).type, (p)=>{
                    tiles.push({x: p.x, y: p.y});
                });
                for(const tile of tiles){
                    tileMap.placeTile(tile.x, tile.y, state.tileType);
                    if(tiles.length >= floodDepth) break;
                }
                break;
            default:
                break;
        }
    }

}