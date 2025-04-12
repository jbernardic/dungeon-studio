import './components/SceneComponent'
import { Scene } from "@babylonjs/core";
import SceneComponent from './components/SceneComponent'
import SidePanelComponent from './components/SidePanelComponent';
import { EditorScene } from './scenes/editorScene';
import { useEditorStore } from './stores/editorStore';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"

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
                <MenubarCheckboxItem>Enable top-down camera</MenubarCheckboxItem>
                <MenubarSeparator></MenubarSeparator>
                <MenubarItem>Reset camera</MenubarItem>
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
