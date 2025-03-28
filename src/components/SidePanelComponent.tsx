import { usePaintToolStore } from "../stores/paintToolStore"

const SidePanelComponent = ({
    ...rest
}) => {

    const paintToolStore = usePaintToolStore();

    return <div {...rest}>
        <div className="p-5">
            <h1 className="text-center font-bold text-xl w-[100%]">Dungeon Studio</h1>
            <form>
                <div>
                    <h1 className="text-lg">Paint Tool</h1>
                    {paintToolStore.tileTypes.map((tileType) => (
                        <div key={tileType}>
                            <label>
                                <span>{tileType} </span>
                                <input
                                    onChange={() => paintToolStore.setSelectedTile(tileType)}
                                    checked={paintToolStore.selectedTile === tileType}
                                    type="radio"
                                    value={tileType}
                                    name="tileSelection"
                                />
                            </label>
                        </div>
                    ))}
                    <div>Selected tile: {paintToolStore.selectedTile}</div>
                </div>

            </form>
        </div>
    </div>;
};

export default SidePanelComponent;