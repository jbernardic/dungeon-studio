import { usePaintToolStore } from "../stores/paintToolStore"
import { TileType } from "../types/tileTypes";
import { PaintToolMode } from "../types/toolTypes";
import { Button } from "@/components/ui/button"

const SidePanelComponent = ({
    ...rest
}) => {

    return <div {...rest}>
        <div className="p-5">
            <h1 className="text-center font-bold text-xl w-[100%]">Dungeon Studio</h1>
            <form>
                <div>
                    <h1 className="text-lg">Paint Tool</h1>
                    <hr></hr>
                    <label>
                        <div>
                            <span>tile: </span>
                            <select onChange={(event)=>usePaintToolStore.setState({tileType: event.target.value as TileType})}>
                                {Object.values(TileType).map(tileType=>
                                    <>
                                        <option value={tileType}>{tileType}</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <span>mode: </span>
                            <select onChange={(event)=>usePaintToolStore.setState({mode: event.target.value as PaintToolMode})}>
                                {Object.values(PaintToolMode).map(tileType=>
                                    <>
                                        <option value={tileType}>{tileType}</option>
                                    </>
                                )}
                            </select>
                        </div>

                    </label>
                    <Button>Click me</Button>

                </div>

            </form>
        </div>
    </div>;
};

export default SidePanelComponent;