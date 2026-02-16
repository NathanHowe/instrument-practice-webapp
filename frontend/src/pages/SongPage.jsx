import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

function SongPage() {
    const { id } = useParams();
    const containerRef = useRef(null);
    const [song, setSong] = useState(null);

    useEffect(() => {
        const fetchSong = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://127.0.0.1:5000/api/songs/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            setSong(data);
        };

        fetchSong();
    }, [id]);


    useEffect(() => {
        if (!song || !containerRef.current) return;

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
            autoResize: true,
            backend: "svg",
            drawingParameters: "default",
            stretchLastSystemLine: true,
        });

        osmd.load(song.content)
            .then(() => {

                osmd.EngravingRules.SoftMaxMeasureWidth = 1200;

                osmd.zoom = 0.75;
                osmd.render();
            })
            .catch(err =>
                console.error("OSMD load error:", err)
            );

    }, [song]);

    return (
        <div className="container-fluid mt-4">
            <div className="score-container"
                ref={containerRef}
                style={{
                    width: "min(1200px, 90vw)",
                    minHeight: "400px",
                    margin: "0 auto"
}}
            />
        </div>
    );
}

export default SongPage;
