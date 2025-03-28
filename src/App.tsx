import './components/SceneComponent'
import { Scene } from "@babylonjs/core";
import SceneComponent from './components/SceneComponent'
import SidePanelComponent from './components/SidePanelComponent';
import { EditorScene } from './scenes/editorScene';

function App() {
  
  let editorScene: EditorScene;

  const onSceneReady = (scene: Scene) => {
    editorScene = new EditorScene(scene);
  };

  const onRender = () => {
    editorScene.update();
  };

  return (
    <div className='flex w-full h-screen'>
      <SidePanelComponent className="w-[400px] flex-shrink-0"/>
      <div className='flex-1'>
        <SceneComponent onSceneReady={onSceneReady} onRender={onRender} style={{width: "100%", height: "100%", outline: "none"}} />
      </div>
    </div>
  )
}

export default App
