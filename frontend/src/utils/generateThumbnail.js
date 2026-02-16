import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export async function generateThumbnail(xmlString) {
    if (!xmlString) return null;

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px"; 
    document.body.appendChild(container);

    try {
        const osmd = new OpenSheetMusicDisplay(container, {
            backend: "svg",
            drawingParameters: "compact",
            autoResize: false,
        });

        await osmd.load(xmlString);

        osmd.EngravingRules.MaxSystemCount = 1;
        osmd.EngravingRules.StretchLastSystemLine = true;
        osmd.EngravingRules.MinMeasureWidth = 120;
        osmd.zoom = 0.35;
        osmd.render();

        const svg = container.querySelector("svg");
        if (!svg) throw new Error("No SVG rendered");

        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();

        const dataUrl = await new Promise((resolve) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 300;
                canvas.height = 150;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/png"));
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });

        document.body.removeChild(container);
        return dataUrl;
    } catch (err) {
        console.error("Thumbnail generation failed:", err);
        document.body.removeChild(container);
        return null;
    }
}
