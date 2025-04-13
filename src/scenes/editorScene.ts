import { Scene, MeshBuilder, Vector3, Color3, FreeCamera, HemisphericLight, AbstractMesh, PointerEventTypes, DynamicTexture, Texture, DirectionalLight, ShadowGenerator, KeyboardEventTypes, Camera, Quaternion } from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import { MeshUtils } from '../utils/meshUtils';
import { JunctionType, Tile, TileType, WallTile } from '../types/tileTypes';
import { TileMap } from '../utils/tileMap';
import { GridMaterial, SimpleMaterial, SkyMaterial } from '@babylonjs/materials';
import { PaintTool } from './editorTools';
import { useEditorStore } from '@/stores/editorStore';

class DebugTileColors{
    static readonly Empty = new Color3(0.3, 0.45, 0.3);
    static readonly Floor = new Color3(1, 1, 0);
    static readonly Wall = new Color3(0, 0, 1);
}

export class EditorScene {
    private scene: Scene;
    private placeMesh: AbstractMesh;
    private wallMeshes: Map<JunctionType, AbstractMesh> = new Map();
    private groundTexture: DynamicTexture;
    private groundMesh: AbstractMesh;
    private paintMode: boolean = false;
    private lastPaintedTile: {x: number, y: number} | null = null;
    private tileMap: TileMap = new TileMap();
    private paintTool: PaintTool = new PaintTool();
    private shadowGenerator: ShadowGenerator;
    private isRightPointerDown: boolean = false;
    private absPointerPosition: {x: number, y: number} = {x: 0, y: 0};

    constructor(scene: Scene) {
        this.scene = scene;
        scene.onPointerObservable.add((info) => {
            this.absPointerPosition = {x: info.event.clientX, y: info.event.clientY};
            if (info.type == PointerEventTypes.POINTERDOWN) {
                if(info.event.button == 0){
                    this.paintMode = true;
                }
                if(info.event.button == 2){
                    this.isRightPointerDown = true;
                }
            }
            if (info.type == PointerEventTypes.POINTERUP) {
                if(info.event.button == 0){
                    this.paintMode = false;
                    this.lastPaintedTile = null;
                }
                if(info.event.button == 2){
                    this.isRightPointerDown = false;
                }
            }
        });

        scene.onKeyboardObservable.add((info)=>{
            if( info.type == KeyboardEventTypes.KEYDOWN &&
                info.event.ctrlKey && info.event.key == "z"){
                this.undoTiles();
            }
            else if( info.type == KeyboardEventTypes.KEYDOWN &&
                info.event.ctrlKey && info.event.key == "y"){
                this.redoTiles();
            }
            else if( info.type == KeyboardEventTypes.KEYDOWN && info.event.key == " "){
                const topDown = useEditorStore.getState().isTopDown;
                useEditorStore.getState().sendCommand(!topDown ? "TOPDOWN_TRUE" : "TOPDOWN_FALSE");
            }
        });

        scene.onBeforeRenderObservable.add(()=>{
            const {command, clearCommand} = useEditorStore.getState();
            if(command == "UNDO"){
                this.undoTiles();
            }
            else if(command == "REDO"){
                this.redoTiles();
            }
            else if(command == "EXPORT"){
                //TODO
            }
            else if(command == "TOPDOWN_TRUE"){
                this.setTopDownView();
                useEditorStore.getState().setTopDown(true);
            }
            else if(command == "TOPDOWN_FALSE"){
                this.setFreeView();
                useEditorStore.getState().setTopDown(false);
            }
            clearCommand();
        });

        this.setFreeView();

        // Hemispheric Light (ambient light)
        const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light1.intensity = 0.7;
        light1.groundColor = new Color3(0.2, 0.4, 0.2); // Brighter green bounce
        light1.diffuse = new Color3(0.4, 0.6, 0.8); 


        // Directional Light (like sunlight)
        const light2 = new DirectionalLight("light2", new Vector3(-1, -2, -1), scene);
        light2.position = new Vector3(5, 10, 5);
        light2.intensity = 1;
        light2.diffuse = new Color3(1, 0.95, 0.85);  // Warm white with yellow tint
        light2.specular = new Color3(1, 0.9, 0.7);  // Brighter highlights

        const groundSize = 1000;
        
        //Shadow
        this.shadowGenerator = new ShadowGenerator(groundSize, light2);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        
        //Skybox
        const skyMaterial = new SkyMaterial("skyMaterial", scene);
        skyMaterial.backFaceCulling = false;
        skyMaterial.inclination = 10; //angle of the sun

        const skybox = MeshBuilder.CreateBox("skyBox", { size: groundSize }, scene);
        skybox.material = skyMaterial;

        //Ground
        this.groundTexture = new DynamicTexture("groundDynamicTexture", groundSize, scene, true);
        this.groundTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.groundTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        this.groundMesh = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);
        const groundMaterial = new SimpleMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = this.groundTexture;

        this.groundMesh.material = groundMaterial;
        this.groundMesh.receiveShadows = true;


        this.groundTexture.updateSamplingMode(1);
        const ctx = this.groundTexture.getContext();
        ctx.fillStyle = DebugTileColors.Empty.toHexString();
        ctx.fillRect(0, 0, this.groundTexture.getSize().width, this.groundTexture.getSize().height);

        this.groundTexture.update();

        //Grid
        const gridMesh = MeshBuilder.CreateGround("grid", { width: groundSize, height: groundSize }, scene);
        const gridMaterial = new GridMaterial("grid", scene);
        gridMaterial.gridRatio = 1;
        gridMaterial.majorUnitFrequency = 3;
        gridMaterial.opacity = 0.99;
        gridMaterial.alpha = 1;
        gridMaterial.lineColor = new Color3(0, 0, 0);
        gridMesh.material = gridMaterial
        gridMesh.position.y = 0.01;

        this.placeMesh = MeshBuilder.CreateBox("placeMesh", { size: 0.25 }, scene);
        this.placeMesh.material = new SimpleMaterial("placeMeshMaterial", this.scene);
        (this.placeMesh.material as SimpleMaterial).alpha = 0.6;
        (this.placeMesh.material as SimpleMaterial).disableLighting = true;
        this.placeMesh.setEnabled(false);

        MeshUtils.import("models/RockWall/Wall.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.Base, mesh!);
        });
        MeshUtils.import("models/RockWall/Wall_T1.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T1, mesh!);
        });
        MeshUtils.import("models/RockWall/Wall_T2.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T2, mesh!);
        });
        MeshUtils.import("models/RockWall/Wall_T3.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T3, mesh!);
        });
        MeshUtils.import("models/RockWall/Wall_T4.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T4, mesh!);
        });
        MeshUtils.import("models/RockWall/Wall_T0.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T0, mesh!);
        });
    }

    update() {
        const pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
            (mesh) => mesh.name == "ground"
        );
        if (pickInfo.hit) {
            let x, z;
            if(this.paintTool.getState().tileType == TileType.Wall){
                x = Math.round(pickInfo.pickedPoint!.x)-0.5;
                z = Math.round(pickInfo.pickedPoint!.z)-0.5;    
            }
            else if(this.paintTool.getState().tileType == TileType.Empty){
                x = Math.round(pickInfo.pickedPoint!.x*2)/2-0.5;
                z = Math.round(pickInfo.pickedPoint!.z*2)/2-0.5;   
            }
            else{
                x = Math.floor(pickInfo.pickedPoint!.x);
                z = Math.floor(pickInfo.pickedPoint!.z);
            }

            let y = pickInfo.pickedPoint!.y;

            this.placeMesh.setEnabled(true);

            this.placeMesh.position.x = x+0.5;
            this.placeMesh.position.z = z+0.5;
            this.placeMesh.position.y = y;

            if (this.paintMode) {
                if(this.lastPaintedTile?.x != x || this.lastPaintedTile?.y != z){                    
                    this.paintTool.paint(x, z, this.tileMap);
                    this.lastPaintedTile = {x, y: z};

                    this.tileMap.pollChanges().forEach(({x, y, value}) => {
                        this.handleTileChange(x, y, value);
                    });
                }
            }
        }
    }

    private setTopDownView() {
        const scene = this.scene;
        const prevCamera = scene.activeCamera as FreeCamera | null;
        const prevCameraPosition = prevCamera?.position ?? new Vector3(0, 50, 0);
        const prevCameraRotation = prevCamera?.rotation ?? new Vector3(0, 0, 0);

        scene.activeCamera?.dispose();
        const camera = new FreeCamera(
            "TopDownCamera",
            prevCameraPosition.clone(),
            scene
          );
        
          // Look straight down
          camera.rotationQuaternion = Quaternion.RotationYawPitchRoll(
            prevCameraRotation.y,  // Yaw (left/right)
            Math.PI / 2,           // Pitch (look straight down)
            prevCameraRotation.z   // Roll (tilt)
        );
        
          // Disable built-in controls
          camera.inputs.clear();
        
          // Manual key tracking
          const inputMap: Record<string, boolean> = {};
        
          scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
              inputMap[key] = true;
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
              inputMap[key] = false;
            }
          });
        
          // Move the camera each frame
          const moveObserver = scene.onBeforeRenderObservable.add(() => {
            const move = new Vector3(0, 0, 0);
            const speed = 0.5;
        
            if (inputMap["w"]) move.z += 1;
            if (inputMap["s"]) move.z -= 1;
            if (inputMap["a"]) move.x -= 1;
            if (inputMap["d"]) move.x += 1;
        
            if (!move.equals(Vector3.Zero())) {
                move.normalize().scaleInPlace(speed);
        
                // Transform movement from local space to world space
                const forward = camera.getForwardRay().direction; // Forward vector
                const right = Vector3.Cross(camera.upVector, forward).normalize();
                const up = Vector3.Cross(forward, right);
        
                // Compute world movement direction
                const worldMove = up.scale(move.z)
                    .add(right.scale(move.x))
                    // .add(up.scale(move.y)); // Uncomment if you add vertical movement
        
                camera.position.addInPlace(worldMove);
            }
          });

          camera.onDispose = ()=>{
            scene.onBeforeRenderObservable.remove(moveObserver);
          }
        
          const canvas = scene.getEngine().getRenderingCanvas();
          camera.attachControl(canvas, true);
          scene.activeCamera = camera;
    }

    private setFreeView(){
        const prevCamera = this.scene.activeCamera as FreeCamera | null;
        const prevCameraPosition = prevCamera?.position.clone() ?? new Vector3(0, 5, -10);
        const prevCameraRotation = prevCamera?.rotationQuaternion.clone();
        
        this.scene.activeCamera?.dispose();
        const camera = new FreeCamera("camera1", prevCameraPosition, this.scene);
        if(prevCameraRotation){
            camera.rotationQuaternion = prevCameraRotation;
        }
        else{
            camera.setTarget(Vector3.Zero());
        }

        camera.keysUpward.push(69);
        camera.keysDownward.push(81);
        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysLeft.push(65);
        camera.keysRight.push(68);
        //@ts-ignore
        camera.inputs.attached.mouse.buttons = [2];

        const canvas = this.scene.getEngine().getRenderingCanvas();
        camera.attachControl(canvas, true);
        this.scene.activeCamera = camera;
        
        //hack to preserve holding right click after attaching new controls
        //TODO - clean this up
        if(this.isRightPointerDown){
            const ptrDownEvent = new PointerEvent("pointerdown", {
                clientX: this.absPointerPosition.x,  // X position relative to viewport
                clientY: this.absPointerPosition.y,  // Y position relative to viewport
                button: 2,     // 0 = left click, 1 = middle, 2 = right
                bubbles: true
            });
            canvas?.dispatchEvent(ptrDownEvent);
        }


    }

    private undoTiles(){
        this.tileMap.undo();
        this.tileMap.pollChanges().forEach(({x, y, value}) => {
            this.handleTileChange(x, y, value);
        });
    }

    private redoTiles(){
        this.tileMap.redo();
        this.tileMap.pollChanges().forEach(({x, y, value}) => {
            this.handleTileChange(x, y, value);
        });
    }

    private handleTileChange(x: number, y: number, tile: Tile){
        this.scene.getMeshByName(`Wall (${x},${y})`)?.dispose();
        if (tile.type == TileType.Wall) {
            this.placeWallMesh(x, this.groundMesh.position.y, y, (tile as WallTile).junction, (tile as WallTile).direction);
            //this.setGroundColor(x, y, DebugTileColors.Wall);
        }
        else if (tile.type == TileType.Empty) {
            this.setGroundColor(x, y, DebugTileColors.Empty);
        }
        else if (tile.type == TileType.Floor) {
            this.setGroundColor(x, y, DebugTileColors.Floor);
        }
    }

    private setGroundColor(x: number, y: number, color: Color3){
        const groundSize = this.groundTexture.getSize();
        const groundCorner = { x: this.groundMesh.position.x - groundSize.width/2, y: this.groundMesh.position.z - groundSize.height/2 };
        x = x - groundCorner.x;
        y = y - groundCorner.y;
        y = groundSize.height - y - 1; //flip y axis
        const ctx = this.groundTexture.getContext();
        ctx.fillStyle = color.toHexString();
        ctx.fillRect(x, y, 1, 1);
        this.groundTexture.update();
    }

    private placeWallMesh(x: number, y: number, z: number, junction: JunctionType, direction: number) {
        const wallScale = 0.5;
        const newWall = this.wallMeshes.get(junction)!.clone(`Wall (${x},${z})`, null);
        newWall!.position = new Vector3(x + 0.5, y, z + 0.5);

        newWall!.rotate(new Vector3(0, 1, 0), -(direction * 0.5 + 0.5) * Math.PI);
        newWall?.setEnabled(true);
        newWall?.scaling.multiplyInPlace(new Vector3(wallScale, wallScale, wallScale));
        this.shadowGenerator.addShadowCaster(newWall!);
        return newWall;
    }
}