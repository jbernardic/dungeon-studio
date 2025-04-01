import { Scene, MeshBuilder, Color4, Vector3, Color3, FreeCamera, HemisphericLight, AbstractMesh, PointerEventTypes, DynamicTexture, Texture, DirectionalLight } from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import { MeshUtils } from '../utils/meshUtils';
import { JunctionType, Tile, TileType, WallTile } from '../types/tileTypes';
import { TileMap } from '../utils/tileMap';
import { GridMaterial, SimpleMaterial, SkyMaterial } from '@babylonjs/materials';
import { PaintTool } from './editorTools';

class DebugTileColors{
    static readonly Empty = new Color3(0.5, 0.5, 0.5);
    static readonly Floor = new Color3(1, 1, 0);
    static readonly Wall = new Color3(0, 0, 1);
}

export class EditorScene {
    private scene: Scene;
    private placeMesh: AbstractMesh;
    private wallMeshes: Map<JunctionType, AbstractMesh> = new Map();
    private groundTexture: DynamicTexture;
    private groundMesh: AbstractMesh;
    private camera: FreeCamera;
    private paintMode: boolean = false;
    private lastPaintedTile: {x: number, y: number} | null = null;
    private tileMap: TileMap = new TileMap();

    constructor(scene: Scene) {
        this.scene = scene;
        scene.onPointerObservable.add((info) => {
            if (info.type == PointerEventTypes.POINTERDOWN) {
                if(info.event.button == 0){
                    this.paintMode = true;
                }
            }
            if (info.type == PointerEventTypes.POINTERUP) {
                if(info.event.button == 0){
                    this.paintMode = false;
                    this.lastPaintedTile = null;
                }
            }
            // if (kbInfo.type == PointerEventTypes.POINTERWHEEL) //scroll
            // {
            //     const event = kbInfo.event as IWheelEvent;
            //     const sign = Math.sign(event.deltaY);
            //     this.wall?.rotate(new Vector3(0, 0, 1), sign*0.5*Math.PI)
            // }
        });

        this.camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.keysUpward.push(69); //increase elevation
        this.camera.keysDownward.push(81); //decrease elevation
        this.camera.keysUp.push(87); //forwards 
        this.camera.keysDown.push(83); //backwards
        this.camera.keysLeft.push(65);
        this.camera.keysRight.push(68);
        //@ts-ignore
        this.camera.inputs.attached.mouse.buttons = [2];

        const canvas = scene.getEngine().getRenderingCanvas();
        this.camera.attachControl(canvas, true);

        // Hemispheric Light (ambient light)
        const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light1.intensity = 1;

        // Directional Light (like sunlight)
        const light2 = new DirectionalLight("light2", new Vector3(-1, -1, -1), scene);
        light2.position = new Vector3(5, 10, 5);
        light2.intensity = 0.8;

        const groundSize = 1000;

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
        this.groundMesh.material = new SimpleMaterial("groundMaterial", scene);
        (this.groundMesh.material as SimpleMaterial).diffuseTexture = this.groundTexture;

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
        // gridMaterial.gridOffset = new Vector3(groundSize, groundSize, groundSize);
        gridMaterial.opacity = 0.99;
        gridMaterial.alpha = 1;
        gridMaterial.lineColor = new Color3(0, 0, 0);
        gridMesh.material = gridMaterial
        gridMesh.position.y = 0.01;

        this.placeMesh = MeshBuilder.CreateBox("placeMesh", { size: 0.5, faceColors: Array(6).fill(new Color4(0.5, 1, 0.5, 1)) }, scene);
        this.placeMesh.setEnabled(false);

        MeshUtils.import("models/Wall/Wall.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.Base, mesh!);
        });
        MeshUtils.import("models/Wall/Wall_T1.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T1, mesh!);
        });
        MeshUtils.import("models/Wall/Wall_T2.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T2, mesh!);
        });
        MeshUtils.import("models/Wall/Wall_T3.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T3, mesh!);
        });
        MeshUtils.import("models/Wall/Wall_T4.glb", scene).then(mesh => {
            this.wallMeshes.set(JunctionType.T4, mesh!);

            MeshUtils.import("models/Wall/Wall_T0.glb", scene).then(mesh => {
                mesh!.scaling = this.wallMeshes.get(JunctionType.T4)!.scaling;
                this.wallMeshes.set(JunctionType.T0, mesh!);
            });
            
        });
    }

    update() {
        
        const pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
            (mesh) => mesh.name == "ground"
        );
        if (pickInfo.hit) {
            let x = Math.floor(pickInfo.pickedPoint!.x);
            let z = Math.floor(pickInfo.pickedPoint!.z);
            let y = pickInfo.pickedPoint!.y;

            this.placeMesh.setEnabled(true);

            this.placeMesh.position.x = x + 0.5;
            this.placeMesh.position.z = z + 0.5;
            this.placeMesh.position.y = y;

            if (this.paintMode) {
                if(this.lastPaintedTile?.x != x || this.lastPaintedTile?.y != z){                    
                    new PaintTool().paint(x, z, this.tileMap);
                    this.lastPaintedTile = {x, y: z};

                    this.tileMap.pollChanges().forEach(({x, y, value}) => {
                        this.handleTileChange(x, y, value);
                    });
                }
            }
        }
    }

    private handleTileChange(x: number, y: number, tile: Tile){
        this.scene.getMeshByName(`Wall (${x},${y})`)?.dispose();
        if (tile.type == TileType.Wall) {
            this.placeWallMesh(x, this.groundMesh.position.y, y, (tile as WallTile).junction, (tile as WallTile).direction);
            this.setGroundColor(x, y, DebugTileColors.Wall);
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
        const wallScale = 1;
        const newWall = this.wallMeshes.get(junction)!.clone(`Wall (${x},${z})`, null);
        newWall!.position = new Vector3(x + 0.5, y, z + 0.5);

        newWall!.rotate(new Vector3(0, 1, 0), direction * 0.5 * Math.PI);
        newWall?.setEnabled(true);
        newWall?.scaling.multiplyInPlace(new Vector3(wallScale, wallScale, wallScale));
        return newWall;
    }
}