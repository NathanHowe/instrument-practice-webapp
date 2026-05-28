import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useParams } from "react-router-dom";

import {
    OpenSheetMusicDisplay
} from "opensheetmusicdisplay";

import useMetronome from "../hooks/useMetronome";

function SongPage() {

    const { id } = useParams();

    const containerRef = useRef(null);

    const [song, setSong] = useState(null);

    const {
        start,
        stop,
        isPlaying,

        bpm,
        setBpm,

        countInBeat,
        isCountingIn,
    } = useMetronome();

    useEffect(() => {

        const fetchSong = async () => {

            const token =
                localStorage.getItem("token");

            const res = await fetch(
                `http://127.0.0.1:5000/api/songs/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            setSong(data);
        };

        fetchSong();

    }, [id]);

    useEffect(() => {

        if (!song || !containerRef.current)
            return;

        const osmd =
            new OpenSheetMusicDisplay(
                containerRef.current,
                {
                    autoResize: true,
                    backend: "svg",
                    drawingParameters:
                        "default",

                    stretchLastSystemLine:
                        true,

                    noteheadScaling: 1.2,
                }
            );

        osmd.load(song.content)
            .then(() => {

                osmd.EngravingRules
                    .SoftMaxMeasureWidth =
                    1200;

                osmd.zoom = 0.75;

                osmd.render();
            })
            .catch(err =>
                console.error(
                    "OSMD load error:",
                    err
                )
            );

    }, [song]);

    return (
        <div className="container-fluid mt-4">

            <div className="text-center mb-4">

                <button
                    className="btn btn-primary"
                    onClick={
                        isPlaying
                            ? stop
                            : start
                    }
                >
                    {
                        isPlaying
                            ? "Stop Practice"
                            : "Start Practice"
                    }
                </button>

                <div className="mt-3">

                    <label className="form-label">
                        BPM
                    </label>

                    <input
                        type="number"
                        className="form-control w-auto mx-auto"
                        value={bpm}
                        onChange={(e) =>
                            setBpm(
                                Number(
                                    e.target.value
                                )
                            )
                        }
                    />

                </div>

                {
                    
                    isCountingIn &&
                    countInBeat < 8 && (
                        <h1 className="mt-4">
                            {8 - countInBeat}
                        </h1>
                    )
                }

                {
                    isPlaying &&
                    !isCountingIn && (
                        <h2 className="mt-4 text-success">
                            PLAY
                        </h2>
                    )
                }

            </div>

            <div
                className="score-container"
                ref={containerRef}
                style={{
                    width:
                        "min(1200px, 90vw)",

                    minHeight: "400px",

                    margin: "0 auto",
                }}
            />

        </div>
    );
}

export default SongPage;