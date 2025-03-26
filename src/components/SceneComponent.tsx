import { useEffect, useRef } from "react";
import { Engine, EngineOptions, Scene, SceneOptions } from "@babylonjs/core";

interface SceneComponentProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  antialias?: boolean;
  engineOptions?: EngineOptions;
  adaptToDeviceRatio?: boolean;
  sceneOptions?: SceneOptions;
  onRender?: (scene: Scene) => void;
  onSceneReady: (scene: Scene) => void;
}

const SceneComponent: React.FC<SceneComponentProps> = ({
  antialias,
  engineOptions,
  adaptToDeviceRatio,
  sceneOptions,
  onRender,
  onSceneReady,
  ...rest
}) => {
  const reactCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = reactCanvas.current;
    if (!canvas) return;

    const engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
    const scene = new Scene(engine, sceneOptions);

    if (scene.isReady()) {
      onSceneReady(scene);
    } else {
      scene.onReadyObservable.addOnce(onSceneReady);
    }

    engine.runRenderLoop(() => {
      if (onRender) onRender(scene);
      scene.render();
    });

    const resize = () => {
      engine.resize();
    };

    window.addEventListener("resize", resize);
    return () => {
      engine.dispose();
      window.removeEventListener("resize", resize);
    };
  }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady]);

  return <canvas ref={reactCanvas} {...rest} />;
};

export default SceneComponent;
