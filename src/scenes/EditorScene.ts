import { Scene, MeshBuilder, Color4, Vector3, Color3, FreeCamera, HemisphericLight, AbstractMesh, PointerEventTypes, DynamicTexture, Texture, StandardMaterial } from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import { SparseGrid } from '../utils/sparseGrid';
import { MeshUtils } from '../utils/meshUtils';
import { JunctionType, Tile, TileType, WallTile } from '../types/tileTypes';
import { usePaintToolStore } from '../stores/paintToolStore';
import { TileMap } from '../utils/tileMap';

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

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        this.groundTexture = new DynamicTexture("groundDynamicTexture", 10, scene, true);
        this.groundTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.groundTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

        this.groundMesh = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
        this.groundMesh.material = new StandardMaterial("groundMaterial", this.scene);
        (this.groundMesh.material as StandardMaterial).diffuseTexture = this.groundTexture;

        this.groundTexture.updateSamplingMode(1);
        const ctx = this.groundTexture.getContext();
        ctx.fillStyle = Color3.Green().toHexString();
        ctx.fillRect(0, 0, this.groundTexture.getSize().width, this.groundTexture.getSize().height);

        this.groundTexture.update();

        this.createGridLines(1, 10);

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

        this.tileMap.onTileChange.push( (x: number, y: number, tile: Tile) => {
            this.scene.getMeshByName(`Wall (${x},${y})`)?.dispose();
            if (tile.type == TileType.Wall) {
                this.placeWallMesh(x, this.groundMesh.position.y, y, (tile as WallTile).junction, (tile as WallTile).direction);
                this.setGroundColor(x, y, Color3.Blue());
            }
            else if (tile.type == TileType.Empty) {
                this.setGroundColor(x, y, Color3.Green());
            }
            else if (tile.type == TileType.Floor) {
                this.setGroundColor(x, y, Color3.Yellow());
            }
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
                const tileType = usePaintToolStore.getState().tile;
                if(this.lastPaintedTile?.x != x || this.lastPaintedTile?.y != z){ 
                    this.tileMap.paintTile(x, z, tileType);
                    this.lastPaintedTile = {x, y: z};
                }
            }
        }
    }

    private setGroundColor(x: number, y: number, color: Color3){
        x+=5;
        y+=5;
        y = 10-y-1;
        const ctx = this.groundTexture.getContext();
        ctx.fillStyle = color.toHexString();
        ctx.fillRect(x, y, 1, 1);
        this.groundTexture.update();
    }

    private placeWallMesh(x: number, y: number, z: number, junction: JunctionType, direction: number) {
        const newWall = this.wallMeshes.get(junction)!.clone(`Wall (${x},${z})`, null);
        newWall!.position = new Vector3(x + 0.5, y, z + 0.5);

        newWall!.rotate(new Vector3(0, 1, 0), direction * 0.5 * Math.PI);
        newWall?.setEnabled(true);
    }

    private createGridLines(gridSize: number, gridLength: number) {
        const gridLines = [];

        // Create vertical grid lines
        for (let i = -gridLength / 2; i <= gridLength / 2; i += gridSize) {
            const points = [
                new Vector3(i, 0, -gridLength / 2),
                new Vector3(i, 0, gridLength / 2),
            ];
            const line = MeshBuilder.CreateLines("verticalLine" + i, { points: points }, this.scene);
            line.color = new Color3(0, 0, 0); // Set line color (black)
            gridLines.push(line);
        }

        // Create horizontal grid lines
        for (let i = -gridLength / 2; i <= gridLength / 2; i += gridSize) {
            const points = [
                new Vector3(-gridLength / 2, 0, i),
                new Vector3(gridLength / 2, 0, i),
            ];
            const line = MeshBuilder.CreateLines("horizontalLine" + i, { points: points }, this.scene);
            line.color = new Color3(0, 0, 0); // Set line color (black)
            gridLines.push(line);
        }

        return gridLines;
    }
}