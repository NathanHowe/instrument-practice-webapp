import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { generateMusicXML } from "../utils/generateMusicXML";

export default function StaffDisplay({ note }) {
    const containerRef = useRef(null);
    const osmdRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Create OSMD once
        if (!osmdRef.current) {
            osmdRef.current = new OpenSheetMusicDisplay(
                containerRef.current,
                {
                    autoResize: true,
                    drawTitle: false,
                    drawPartNames: false,
                    // renderSingleHorizontalStaffline: true,
                    // drawingParameters: "compacttight",
                    stretchLastSystemLine: true,
                }
            );

            osmdRef.current.Zoom = 1.6;
        }

        const xml = generateMusicXML(note); // note can be null

        let cancelled = false;

        async function render() {
            try {
                await osmdRef.current.load(xml);
                if (!cancelled) {
                    osmdRef.current.render();
                }
            } catch (err) {
                console.error("OSMD render error:", err);
            }
        }

        render();

        return () => {
            cancelled = true;
        };
    }, [note]);

    return (
        <div className="staff-container">
            <div ref={containerRef} />
        </div>
    );
}