import { usePaintToolStore } from "../stores/paintToolStore"
import { TileType } from "../types/tileTypes";
import { PaintToolMode } from "../types/toolTypes";
import {Card} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const SidePanelComponent = ({
    ...rest
}) => {

    const { tileType, mode } = usePaintToolStore();

    return <div className="h-lvh" {...rest}>
        <div className="p-5">
            <h1 className="text-primary text-left font-bold text-lg">Dungeon studio</h1>
                <Card className="p-4 mt-5">
                    <h1 className="font-bold text-center">Paint tool</h1>
                    <div>
                        <h2>Select Tile</h2>
                        <ToggleGroup value={tileType} type="single" onValueChange={(val)=>val.length>0 && usePaintToolStore.setState({tileType: val as TileType})}>
                            {Object.values(TileType).map(tileType=>
                                    <ToggleGroupItem key={tileType} value={tileType}>{tileType}</ToggleGroupItem>
                            )}
                        </ToggleGroup>

                    </div>
                    <div>
                        <h2>Select Mode</h2>
                        <ToggleGroup value={mode} type="single" onValueChange={(val)=>val.length>0 && usePaintToolStore.setState({mode: val as PaintToolMode})}>
                            {Object.values(PaintToolMode).map(mode=>
                                    <ToggleGroupItem key={mode} value={mode}>{mode}</ToggleGroupItem>
                            )}
                        </ToggleGroup>
                    </div>
                </Card>
                <Card className="p-4 mt-5">
                    <h1 className="font-bold text-center">Generate</h1>
                    <div>Not done</div>
                </Card>
        </div>
    </div>;
};

export default SidePanelComponent;