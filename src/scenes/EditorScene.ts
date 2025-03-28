import { Scene, MeshBuilder, Color4, Vector3, Color3, FreeCamera, HemisphericLight, AbstractMesh, PointerEventTypes } from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import { SparseGrid } from '../utils/SparseGrid';
import { MeshUtils } from '../utils/MeshUtils';
import { JunctionType, Tile, TileType } from '../types/tileTypes';

export class EditorScene {
    private scene: Scene;
    private placeMesh: AbstractMesh;
    private wallMeshes: Map<JunctionType, AbstractMesh> = new Map();
    private camera: FreeCamera;
    private paintMode: boolean = false;
    private map: SparseGrid<Tile> = new SparseGrid<Tile>();

    constructor(scene: Scene) {
        this.scene = scene;

        scene.onPointerObservable.add((kbInfo) => {
            if (kbInfo.type == PointerEventTypes.POINTERDOWN && kbInfo.event.button == 0) {
                this.paintMode = true;
            }
            if (kbInfo.type == PointerEventTypes.POINTERUP && kbInfo.event.button == 0) {
                this.paintMode = false;
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
        this.camera.inputs.attached.mouse.buttons = [2]

        const canvas = scene.getEngine().getRenderingCanvas();
        this.camera.attachControl(canvas, true);

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
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

            if (this.map.get(x, z)?.type != TileType.Floor && this.paintMode) {
                this.map.set(x, z, { type: TileType.Floor });

                for (let i = x - 1; i <= x + 1; ++i) {
                    for (let j = z - 1; j <= z + 1; ++j) {
                        if (i == x && j == z) continue;
                        if (this.map.get(i, j)?.type != TileType.Floor) {
                            this.map.set(i, j, { type: TileType.Wall, direction: 0, junction: JunctionType.Base });
                        }
                    }
                }

                this.updateMap();
                this.eraseWalls();

                this.map.forEach((i, j, value) => {
                    
                    if (value?.type == TileType.Wall) {
                        this.placeWall(this.wallMeshes.get(value.junction)!, i, y, j, value.direction);
                    }
                })
            }
        }
    }


    private updateMap() {
        const walls: { x: number, y: number }[] = [];
        this.map.forEach((x, y, value) => {
            if (value?.type == TileType.Wall) walls.push({ x, y });
        });

        for (const { x: i, y: j } of walls) {
            const tN = this.map.get(i, j + 1)?.type == TileType.Wall;
            const tS = this.map.get(i, j - 1)?.type == TileType.Wall;
            const tW = this.map.get(i - 1, j)?.type == TileType.Wall;
            const tE = this.map.get(i + 1, j)?.type == TileType.Wall;
            
            let junction = JunctionType.T0; //T0 (wall with no connection)
            let direction = 0;
            //Base (horizontal wall)
            if (tN && tS && !tW && !tE) {
                junction = JunctionType.Base;
                direction = 0;
            }
            else if (tW && tE && !tN && !tS) {
                junction = JunctionType.Base;
                direction = 1;
            }
            //T1
            else if (!tN && !tW && !tE && tS){
                junction = JunctionType.T1;
                direction = 2;
            }
            else if(!tN && !tW && tE && !tS){
                junction = JunctionType.T1;
                direction = 1;
            }
            else if (!tN && tW && !tE && !tS){
                junction = JunctionType.T1;
                direction = 3;
            }
            else if(tN && !tW && !tE && !tS){
                junction = JunctionType.T1;
                direction = 0;
            }
            //T2
            else if (tN && tW && !tE && !tS) {
                junction = JunctionType.T2;
                direction = 3;
            }
            else if (tN && tE && !tW && !tS) {
                junction = JunctionType.T2;
                direction = 0;
            }
            else if (tS && tW && !tE && !tN) {
                junction = JunctionType.T2;
                direction = 2;
            }
            else if (tS && tE && !tW && !tN) {
                junction = JunctionType.T2;
                direction = 1;
            }
            //T3
            else if (tN && tW && tE && !tS) {
                junction = JunctionType.T3;
                direction = 3;
            }
            else if (tN && tW && !tE && tS) {
                junction = JunctionType.T3;
                direction = 2;
            }
            else if (tN && !tW && tE && tS) {
                junction = JunctionType.T3;
                direction = 0;
            }
            else if (!tN && tW && tE && tS) {
                junction = JunctionType.T3;
                direction = 1;
            }
            //T4
            else if (tN && tW && tE && tS){
                junction = JunctionType.T4;
                direction = 0;
            }
            
            this.map.set(i, j, { type: TileType.Wall, junction, direction: direction });
        }
    }

    private eraseWalls() {
        const toDispose = this.scene.meshes.filter(mesh => mesh.name.startsWith("Wall ("));
        toDispose.forEach(wall => wall.dispose());
    }

    private placeWall(mesh: AbstractMesh, x: number, y: number, z: number, direction: number) {
        const newWall = mesh.clone(`Wall (${x},${z})`, null);
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