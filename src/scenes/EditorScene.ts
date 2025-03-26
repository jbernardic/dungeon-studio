import { Scene, Mesh, MeshBuilder, Color4, Vector3, Color3, FreeCamera, HemisphericLight, SceneLoader, ImportMeshAsync, AbstractMesh, UniversalCamera, Matrix, Space, VertexBuffer, IWheelEvent, Camera, PointerEventTypes, CameraInputTypes, Vector2, TransformNode } from '@babylonjs/core';
import "@babylonjs/loaders/glTF";
import { SparseGrid } from '../utils/SparseGrid';
import { MeshUtils } from '../utils/MeshUtils';


interface FloorTile {
    type: "floor";
}

interface WallTile {
    type: 'wall'; // etc.
    direction: number;
    tIndex: number;
}

type Tile = FloorTile | WallTile;


export class EditorScene {
    private scene: Scene;
    private placeMesh: AbstractMesh;
    private wallMeshes: { [t: number]: AbstractMesh } = {};
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

        MeshUtils.import("models/Wall/Wall_T1.glb", scene).then(mesh => {
            this.wallMeshes[1] = mesh!;
            this.placeMesh = mesh!;
        });
        MeshUtils.import("models/Wall/Wall_T2.glb", scene).then(mesh => {
            this.wallMeshes[2] = mesh!;
        });
        MeshUtils.import("models/Wall/Wall_T3.glb", scene).then(mesh => {
            this.wallMeshes[3] = mesh!;
        });
        MeshUtils.import("models/Wall/Wall_T4.glb", scene).then(mesh => {
            this.wallMeshes[4] = mesh!;
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

            if (this.map.get(x, z)?.type != "floor" && this.paintMode) {
                this.map.set(x, z, { type: "floor" });

                for (let i = x - 1; i <= x + 1; ++i) {
                    for (let j = z - 1; j <= z + 1; ++j) {
                        if (i == x && j == z) continue;
                        if (this.map.get(i, j)?.type != "floor") {
                            this.map.set(i, j, { type: "wall", direction: 0, tIndex: 0 });
                        }
                    }
                }

                this.updateMap();
                this.eraseWalls();

                this.map.forEach((i, j, value) => {
                    console.log(value?.type);
                    if (value?.type == "wall") {
                        this.placeWall(this.wallMeshes[value.tIndex], i, y, j, value.direction);
                    }
                })
            }
        }
    }


    private updateMap() {
        const walls: { x: number, y: number }[] = [];
        this.map.forEach((x, y, value) => {
            if (value?.type == "wall") walls.push({ x, y });
        });

        for (const { x: i, y: j } of walls) {
            const tN = this.map.get(i, j + 1)?.type == "wall";
            const tS = this.map.get(i, j - 1)?.type == "wall";
            const tW = this.map.get(i - 1, j)?.type == "wall";
            const tE = this.map.get(i + 1, j)?.type == "wall";

            let t = 4;
            let direction = 0;
            //1
            if (tN && tS && !tW && !tE) {
                t = 1;
                direction = 0;
            }
            else if (tW && tE && !tN && !tS) {
                t = 1;
                direction = 1;
            }
            //2
            else if (tN && tW && !tE && !tS) {
                t = 2;
                direction = 3;
            }
            else if (tN && tE && !tW && !tS) {
                t = 2;
                direction = 0;
            }
            else if (tS && tW && !tE && !tN) {
                t = 2;
                direction = 2;
            }
            else if (tS && tE && !tW && !tN) {
                t = 2;
                direction = 1;
            }
            //3
            else if (tN && tW && tE && !tS) {
                t = 3;
                direction = 3;
            }
            else if (tN && tW && !tE && tS) {
                t = 3;
                direction = 2;
            }
            else if (tN && !tW && tE && tS) {
                t = 3;
                direction = 0;
            }
            else if (!tN && tW && tE && tS) {
                t = 3;
                direction = 1;
            }

            this.map.set(i, j, { type: "wall", tIndex: t, direction: direction });
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