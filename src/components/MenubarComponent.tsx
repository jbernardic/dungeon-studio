import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/ui/menubar";
import { useEditorStore } from "../stores/editorStore"; // Import your store

const MenubarComponent = () => {
  const isTopDown = useEditorStore(state => state.isTopDown);

  // Memoized function to toggle the camera mode (useCallback prevents unnecessary re-renders)
  const handleTopDownToggle = () => {
    useEditorStore.getState().sendCommand(isTopDown ? "TOPDOWN_FALSE" : "TOPDOWN_TRUE");
  };

  return <div className="absolute top-2 left-1/2 -translate-x-1/2">
    <Menubar className="rounded-md border gap-2 text-primary  shadow">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger>Export as..</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>obj</MenubarItem>
              <MenubarItem>gltf/glb</MenubarItem>
              <MenubarItem>png</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={()=>useEditorStore.getState().sendCommand("UNDO")}>
            Undo <MenubarShortcut>CTRL+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={()=>useEditorStore.getState().sendCommand("REDO")}>
            Redo <MenubarShortcut>CTRL+Y</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={isTopDown} onClick={()=>handleTopDownToggle()} >Enable top-down camera
            <MenubarShortcut>SPACE</MenubarShortcut>
          </MenubarCheckboxItem>
          <MenubarSeparator></MenubarSeparator>
          <MenubarItem onClick={()=>useEditorStore.getState().sendCommand("RESET_CAMERA")} >Reset camera</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  </div>
}

export default MenubarComponent;
