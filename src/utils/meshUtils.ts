import { AbstractMesh, ImportMeshAsync, Scene, TransformNode, Vector3 } from "@babylonjs/core";

export class MeshUtils {
    static async import(path: string, scene: Scene): Promise<AbstractMesh | null> {
        const result = await ImportMeshAsync(path, scene);
        let root: AbstractMesh | null = null;

        for (const m of result.meshes) {
            // m.showBoundingBox = true;
            m.position = new Vector3(0, 0, 0);

            if (m.parent == null) {
                root = m;
            }
            else {
                const parent = m.parent as AbstractMesh | TransformNode;
                parent.position = new Vector3(0, 0, 0);
            }

            m.refreshBoundingInfo({});
        }
        if (root == null) {
            console.error("Invalid mesh import!");
            return null;
        }

        // const boundingInfo = root.getHierarchyBoundingVectors(true, );
        // const boxMin = boundingInfo.min;
        // const boxMax = boundingInfo.max;

        // if(boxMin != Vector3.Zero() && boxMax != Vector3.Zero()){
        //     const scaleX = 0.5/Math.max(Math.abs(boxMin.x), boxMax.x);
        //     const scaleZ = 0.5/Math.max(Math.abs(boxMin.z), boxMax.z);
        //     const uniformScale = Math.min(scaleX, scaleZ);
        //     root.scaling = new Vector3(-uniformScale, uniformScale, uniformScale);
        // }

        root.scaling = new Vector3(-1, 1, 1);

        root.setEnabled(false);
        return root;
    }
}