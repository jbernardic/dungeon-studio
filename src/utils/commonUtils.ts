import { Color3, Color4 } from "@babylonjs/core";

export class CommonUtils {

    static downloadText(content: string, filename: string){
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

    static downloadImage(imageData: (Color4 | Color3)[], filename: string, width: number, height: number) {
        // Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
    
        if (!ctx) {
            console.error("Could not get 2D context.");
            return;
        }
    
        // Create image data buffer
        const imgData = ctx.createImageData(width, height);
        const data = imgData.data;
    
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const pixel = imageData[index];
                const i = (y * width + x) * 4;
    
                data[i]     = Math.floor((pixel?.r ?? 0) * 255); // R
                data[i + 1] = Math.floor((pixel?.g ?? 0) * 255); // G
                data[i + 2] = Math.floor((pixel?.b ?? 0) * 255); // B
                data[i + 3] = Math.floor((pixel instanceof Color4 ? pixel.a : 1) * 255); // A
            }
        }
    
        ctx.putImageData(imgData, 0, 0);
    
        // Export as PNG
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error("Failed to create blob from canvas.");
                return;
            }
    
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename.endsWith(".png") ? filename : filename + ".png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, "image/png");
    }

}