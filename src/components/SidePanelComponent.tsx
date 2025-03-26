const SidePanelComponent = ({
    ...rest
}) => {

    
  
    return <div {...rest}>
        <div className="p-5">
            <h1 className="text-center font-bold text-xl w-[100%]">Dungeon Studio</h1>
            <form>
                <div>
                    <label>
                        Wall: <input type="radio" value="wall" name="selection" />
                    </label>
                </div>
                <div>
                    <label>
                        Door: <input type="radio" value="door" name="selection" />
                    </label>
                </div>
            </form>
        </div>
    </div>;
  };
  
  export default SidePanelComponent;