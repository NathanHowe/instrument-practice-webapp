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

import {
    extractNotesFromParsedXML,
} from "../utils/musicXmlParser";

import useMicrophone from "../hooks/useMicrophone";
import usePitchDetector from "../hooks/usePitchDetector";

import {
    freqToMidi,
    musicXmlNoteToMidi,
} from "../utils/noteUtils";

function SongPage() {

    const { id } = useParams();

    const containerRef = useRef(null);

    const [song, setSong] = useState(null);
    const [notes, setNotes] = useState([]);

    const [currentNoteIndex,
        setCurrentNoteIndex] =
        useState(0);

    const [correctNotes,
        setCorrectNotes] =
        useState(0);

    const noteMatchedRef =
        useRef(false);

    const lastDetectedMidiRef =
        useRef(null);

    const {
        start,
        stop,
        isPlaying,

        bpm,
        setBpm,

        countInBeat,
        isCountingIn,
    } = useMetronome();

    const {
        audioContext,
        source,
        ready,
    } = useMicrophone();

    const frequency =
        usePitchDetector(
            audioContext,
            source
        );

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

                const extractedNotes =
                    extractNotesFromParsedXML(
                        parsed
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

    useEffect(() => {

        if (
            !isPlaying ||
            isCountingIn ||
            !frequency ||
            notes.length === 0
        ) {
            noteMatchedRef.current = false;
            return;
        }

        let noteIndex =
            currentNoteIndex;

        while (
            noteIndex < notes.length &&
            notes[noteIndex].isRest
        ) {

            console.log(
                "Skipping rest"
            );

            noteIndex++;
        }

        if (
            noteIndex !== currentNoteIndex
        ) {

            setCurrentNoteIndex(
                noteIndex
            );

            return;
        }

        const expectedNote =
            notes[noteIndex];

        if (!expectedNote) {
            return;
        }

        const detectedMidi =
            freqToMidi(frequency);

        const expectedMidi =
            musicXmlNoteToMidi(
                expectedNote
            );

        if (expectedMidi == null) {
            return;
        }

        const difference =
            Math.abs(
                detectedMidi -
                expectedMidi
            );

        if (
            difference <= 1 &&
            !noteMatchedRef.current
        ) {

            console.log(
                "Correct note!",
                expectedNote
            );

            noteMatchedRef.current =
                true;

            setCorrectNotes(
                prev => prev + 1
            );

            setCurrentNoteIndex(
                prev => prev + 1
            );
        }

        if (difference > 1) {
            noteMatchedRef.current =
                false;
        }

        lastDetectedMidiRef.current =
            detectedMidi;

    }, [
        frequency,
        currentNoteIndex,
        notes,
        isPlaying,
        isCountingIn
    ]);

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

            <div className="mt-3">

                <p>
                    Mic Ready:
                    {" "}
                    {ready ? "Yes" : "No"}
                </p>

                <p>
                    Frequency:
                    {" "}
                    {
                        frequency
                            ? frequency.toFixed(1)
                            : "---"
                    }
                    {" "}Hz
                </p>

                <p>
                    Current Note:
                    {" "}
                    {currentNoteIndex + 1}
                    {" / "}
                    {notes.length}
                </p>

                <p>
                    Correct Notes:
                    {" "}
                    {correctNotes}
                </p>

                {
                    notes[currentNoteIndex] && (
                        <p>
                            Expected:
                            {" "}
                            {
                                notes[currentNoteIndex]
                                    .isRest
                                    ? "Rest"
                                    : `${notes[currentNoteIndex].step}${notes[currentNoteIndex].alter === 1
                                        ? "#"
                                        : notes[currentNoteIndex].alter === -1
                                            ? "b"
                                            : ""
                                    }${notes[currentNoteIndex].octave}`
                            }
                        </p>
                    )
                }

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