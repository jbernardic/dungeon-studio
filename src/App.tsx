import './components/SceneComponent'
import { Scene } from "@babylonjs/core";
import SceneComponent from './components/SceneComponent'
import SidePanelComponent from './components/SidePanelComponent';
import { EditorScene } from './scenes/editorScene';
import MenubarComponent from "./components/MenubarComponent";

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
        <MenubarComponent></MenubarComponent>

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
