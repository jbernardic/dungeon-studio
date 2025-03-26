import { AbstractMesh, ImportMeshAsync, Scene, TransformNode, Vector3, VertexBuffer } from "@babylonjs/core";

export class MeshUtils {
    static async import(path: string, scene: Scene): Promise<AbstractMesh | null> {
        const result = await ImportMeshAsync(path, scene);
        let root: AbstractMesh | null = null;

        const boxMax = new Vector3(0, 0, 0);
        const boxMin = new Vector3(Infinity, Infinity, Infinity);

        for (const m of result.meshes) {
            m.showBoundingBox = true;
            m.position = new Vector3(0, 0, 0);
            boxMax.maximizeInPlace(m.getBoundingInfo().maximum);
            boxMin.minimizeInPlace(m.getBoundingInfo().minimum);

            if (m.parent == null) {
                root = m;
            }
            else {
                const parent = m.parent as AbstractMesh | TransformNode;
                parent.position = new Vector3(0, 0, 0);
            }
        }
        if (root == null) {
            console.error("Invalid mesh import!");
            return null;
        }

        const size = boxMax.subtract(boxMin);
        
        // Calculate the required scale to fit in 1x1x1, considering current scaling
        const scaleX = 1 / (size.x * root.scaling.x);
        const scaleZ = 1 / (size.z * root.scaling.z);

        // Find the uniform scale factor that maintains proportions
        const uniformScale = Math.min(scaleX, scaleZ);

        // Apply uniform scaling
        root.scaling = new Vector3(
            root.scaling.x * uniformScale,
            -root.scaling.y * uniformScale,
            root.scaling.z * uniformScale
        );

        root.setEnabled(false);
        return root;
    }
}