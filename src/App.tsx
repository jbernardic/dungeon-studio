import './components/SceneComponent'
import { Scene } from "@babylonjs/core";
import SceneComponent from './components/SceneComponent'
import SidePanelComponent from './components/SidePanelComponent';
import { EditorScene } from './scenes/editorScene';
import { useEditorStore } from './stores/editorStore';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function App() {

  let editorScene: EditorScene;

  const onSceneReady = (scene: Scene) => {
    editorScene = new EditorScene(scene);
  };

  const onRender = () => {
    editorScene.update();
  };

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar */}
      <div className="w-[400px] flex-shrink-0">
        <SidePanelComponent />
      </div>

      {/* Main content area */}
      <div className="relative flex-1">
        {/* Menubar centered within this section */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <Menubar className="rounded-md border gap-2 text-primary  shadow">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-left w-full">
                      Export as...
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>obj</DropdownMenuItem>
                      <DropdownMenuItem>gltf/glb</DropdownMenuItem>
                      <DropdownMenuItem>png</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </MenubarItem>
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
              <MenubarRadioGroup value="3D">
                <MenubarRadioItem value="3D">3D</MenubarRadioItem>
                <MenubarRadioItem value="2D">2D</MenubarRadioItem>
              </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        {/* Babylon scene */}
        <SceneComponent
          onSceneReady={onSceneReady}
          onRender={onRender}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  )
}

export default App
