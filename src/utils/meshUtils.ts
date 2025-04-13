import { AbstractMesh, ImportMeshAsync, Mesh, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { OBJExport } from "@babylonjs/serializers";

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

        root.scaling = new Vector3(-1, 1, 1);

        root.setEnabled(false);
        return root;
    }

    static exportOBJ(meshes: AbstractMesh[], filename: string){
        const mergedMesh = Mesh.MergeMeshes( meshes.filter(mesh=>
             mesh && mesh instanceof Mesh && mesh.geometry
        ) as Mesh[], false, true, undefined, false, true);
        if(mergedMesh){
            const text = OBJExport.OBJ([mergedMesh], false, undefined, true);
            this.downloadTextFile(text, filename);
            mergedMesh.dispose();
        }
        else{
            alert("Error while exporting.");
        }
    }

    static downloadTextFile(content: string, filename: string){
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
      
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
      
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}