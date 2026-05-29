import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useParams } from "react-router-dom";

import {
    OpenSheetMusicDisplay
} from "opensheetmusicdisplay";

import { xml2js } from "xml-js";

import useMetronome from "../hooks/useMetronome";

function SongPage() {

    const { id } = useParams();

    const containerRef = useRef(null);

    const [song, setSong] = useState(null);
    const [notes, setNotes] = useState([]);

    const {
        start,
        stop,
        isPlaying,

        bpm,
        setBpm,

        countInBeat,
        isCountingIn,
    } = useMetronome();

    const getChild = (parent, name) => {
        if (!parent?.elements) return null;

        return parent.elements.find(
            (el) =>
                el.type === "element" &&
                el.name === name
        );
    };

    const getText = (element) => {
        if (!element?.elements) return null;

        const textNode =
            element.elements.find(
                (el) =>
                    el.type === "text"
            );

        return textNode
            ? textNode.text
            : null;
    };

    useEffect(() => {

        const fetchSong = async () => {

            try {

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

                if (!res.ok) {
                    throw new Error(
                        "Failed to load song"
                    );
                }

                const data =
                    await res.json();

                const xmlText =
                    data.content;

                console.log(
                    "First 500 chars of XML:"
                );

                console.log(
                    xmlText.substring(
                        0,
                        500
                    )
                );

                const parsed =
                    xml2js(
                        xmlText,
                        {
                            compact: false,
                            spaces: 2,
                        }
                    );

                console.log(
                    "FULL PARSED XML:",
                    parsed
                );

                const score =
                    parsed.elements?.find(
                        (el) =>
                            el.type ===
                            "element" &&
                            el.name ===
                            "score-partwise"
                    );

                if (!score) {
                    console.error(
                        "No score-partwise found"
                    );
                } else {

                    const part =
                        getChild(
                            score,
                            "part"
                        );

                    if (!part) {
                        console.error(
                            "No part found"
                        );
                    } else {

                        const measures =
                            part.elements?.filter(
                                (el) =>
                                    el.type ===
                                    "element" &&
                                    el.name ===
                                    "measure"
                            ) || [];

                        console.log(
                            "Measures:",
                            measures.length
                        );

                        const extractedNotes =
                            [];

                        measures.forEach(
                            (
                                measure
                            ) => {

                                const noteElements =
                                    measure.elements?.filter(
                                        (
                                            el
                                        ) =>
                                            el.type ===
                                            "element" &&
                                            el.name ===
                                            "note"
                                    ) ||
                                    [];

                                noteElements.forEach(
                                    (
                                        note
                                    ) => {

                                        const rest =
                                            getChild(
                                                note,
                                                "rest"
                                            );

                                        if (
                                            rest
                                        ) {
                                            extractedNotes.push(
                                                {
                                                    step: null,
                                                    octave: null,
                                                    alter: 0,
                                                    isRest: true,
                                                }
                                            );

                                            return;
                                        }

                                        const pitch =
                                            getChild(
                                                note,
                                                "pitch"
                                            );

                                        if (
                                            !pitch
                                        ) {
                                            return;
                                        }

                                        const stepElement =
                                            getChild(
                                                pitch,
                                                "step"
                                            );

                                        const octaveElement =
                                            getChild(
                                                pitch,
                                                "octave"
                                            );

                                        const alterElement =
                                            getChild(
                                                pitch,
                                                "alter"
                                            );

                                        const step =
                                            getText(
                                                stepElement
                                            );

                                        const octave =
                                            octaveElement
                                                ? parseInt(
                                                    getText(
                                                        octaveElement
                                                    )
                                                )
                                                : null;

                                        const alter =
                                            alterElement
                                                ? parseInt(
                                                    getText(
                                                        alterElement
                                                    )
                                                )
                                                : 0;

                                        extractedNotes.push(
                                            {
                                                step,
                                                octave,
                                                alter,
                                                isRest: false,
                                            }
                                        );
                                    }
                                );
                            }
                        );

                        console.log(
                            "Extracted notes:",
                            extractedNotes
                        );

                        console.log(
                            "First 10 notes:",
                            extractedNotes.slice(
                                0,
                                10
                            )
                        );

                        setNotes(
                            extractedNotes
                        );
                    }
                }

                setSong(data);

            } catch (err) {

                console.error(
                    "Error loading song:",
                    err
                );
            }
        };

        fetchSong();

    }, [id]);

    useEffect(() => {

        if (
            !song ||
            !containerRef.current
        ) {
            return;
        }

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

                console.log(
                    "OSMD rendered successfully"
                );
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

                {isCountingIn &&
                    countInBeat < 8 && (
                        <h1 className="mt-4">
                            {8 -
                                countInBeat}
                        </h1>
                    )}

                {isPlaying &&
                    !isCountingIn && (
                        <h2 className="mt-4 text-success">
                            PLAY
                        </h2>
                    )}

            </div>

            <div
                className="score-container"
                ref={containerRef}
                style={{
                    width:
                        "min(1200px, 90vw)",
                    minHeight:
                        "400px",
                    margin: "0 auto",
                }}
            />

        </div>
    );
}

export default SongPage;