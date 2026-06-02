import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useParams, useNavigate } from "react-router-dom";

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

function buildBeatTimeline(notes) {
    let cursor = 0;
    return notes.map((note, i) => {
        const durationBeats =
            note.durationBeats ?? note.duration ?? 1;
        const entry = {
            noteIndex: i,
            startBeat: cursor,
            endBeat: cursor + durationBeats,
        };
        cursor += durationBeats;
        return entry;
    });
}

function findActiveEntry(timeline, beatIndex) {
    // The note whose window contains beatIndex
    for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].startBeat <= beatIndex) {
            return timeline[i];
        }
    }
    return timeline[0] ?? null;
}

function colorNotehead(containerEl, noteIndex, color) {
    if (!containerEl) return;
    const heads = containerEl.querySelectorAll(
        "g.vf-notehead path, g.vf-notehead use"
    );
 
    if (heads[noteIndex]) {
        heads[noteIndex].style.fill = color;
        heads[noteIndex].style.stroke = color;
    }
}

function clearAllNoteColors(containerEl) {
    if (!containerEl) return;
    const heads = containerEl.querySelectorAll(
        "g.vf-notehead path, g.vf-notehead use"
    );
    heads.forEach(el => {
        el.style.fill = "";
        el.style.stroke = "";
    });
}

function SongPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const osmdRef = useRef(null);

    const [song, setSong] = useState(null);
    const [notes, setNotes] = useState([]);

    const timelineRef = useRef([]);

    const [activeNoteIndex, setActiveNoteIndex] = useState(null);

    const [correctNotes, setCorrectNotes] = useState(0);
    const [missedNotes, setMissedNotes] = useState(0);

    const bestMidiPerNoteRef = useRef(new Map());

    const lastJudgedNoteIndexRef = useRef(-1);

    const activeNoteIndexRef = useRef(null);

    const {
        start,
        stop,
        isPlaying,
        bpm,
        setBpm,
        countInBeat,
        isCountingIn,
        onBeatRef,
        getElapsedBeats,
    } = useMetronome();

    const stopRef = useRef(stop);
    useEffect(() => { stopRef.current = stop; }, [stop]);

    const {
        audioContext,
        source,
        ready,
    } = useMicrophone();

    const frequency = usePitchDetector(audioContext, source);

    useEffect(() => {
        if (!isPlaying || isCountingIn || frequency == null) return;

        const midi = freqToMidi(frequency);
        const idx = activeNoteIndexRef.current;

        if (idx != null) {
            bestMidiPerNoteRef.current.set(idx, midi);
        }

    }, [frequency, isPlaying, isCountingIn]);

    useEffect(() => {

        if (notes.length === 0) return;

        const timeline = buildBeatTimeline(notes);
        timelineRef.current = timeline;

        onBeatRef.current = (beatIndex) => {

            const entry = findActiveEntry(timeline, beatIndex);
            if (!entry) return;

            const { noteIndex } = entry;

            setActiveNoteIndex(noteIndex);
            activeNoteIndexRef.current = noteIndex;

            const firstUnjudged = lastJudgedNoteIndexRef.current + 1;

            for (let i = firstUnjudged; i < noteIndex; i++) {
                const judgedNote = notes[i];
                if (judgedNote.isRest) continue;

                const expectedMidi = musicXmlNoteToMidi(judgedNote);
                const detectedMidi = bestMidiPerNoteRef.current.get(i) ?? null;

                const isCorrect =
                    detectedMidi != null &&
                    expectedMidi != null &&
                    Math.abs(detectedMidi - expectedMidi) <= 1;

                colorNotehead(containerRef.current, i, isCorrect ? "#22c55e" : "#ef4444");

                if (isCorrect) {
                    setCorrectNotes(prev => prev + 1);
                } else {
                    setMissedNotes(prev => prev + 1);
                }
            }

            if (noteIndex > lastJudgedNoteIndexRef.current) {
                lastJudgedNoteIndexRef.current = noteIndex - 1;
            }

            const lastEntry = timeline[timeline.length - 1];
            if (lastEntry && beatIndex >= lastEntry.endBeat) {

                const lastIdx = lastEntry.noteIndex;
                if (lastIdx > lastJudgedNoteIndexRef.current) {
                    const lastNote = notes[lastIdx];
                    if (!lastNote.isRest) {
                        const expectedMidi = musicXmlNoteToMidi(lastNote);
                        const detectedMidi =
                            bestMidiPerNoteRef.current.get(lastIdx) ?? null;

                        const isCorrect =
                            detectedMidi != null &&
                            expectedMidi != null &&
                            Math.abs(detectedMidi - expectedMidi) <= 1;

                        colorNotehead(
                            containerRef.current,
                            lastIdx,
                            isCorrect ? "#22c55e" : "#ef4444"
                        );

                        if (isCorrect) {
                            setCorrectNotes(prev => prev + 1);
                        } else {
                            setMissedNotes(prev => prev + 1);
                        }

                        lastJudgedNoteIndexRef.current = lastIdx;
                    }
                }

                stopRef.current();
            }

        };

        return () => {
            onBeatRef.current = null;
        };

    }, [notes, onBeatRef]);

    const cursorRafRef = useRef(null);
    const lastCursorNoteRef = useRef(-1);

    useEffect(() => {

        if (!isPlaying || isCountingIn) {
            cancelAnimationFrame(cursorRafRef.current);
            return;
        }

        const timeline = timelineRef.current;
        if (!timeline || timeline.length === 0) return;

        function updateCursor() {
            const elapsedBeats = getElapsedBeats();

            if (elapsedBeats != null) {
                const entry = findActiveEntry(timeline, elapsedBeats);

                if (
                    entry &&
                    entry.noteIndex !== lastCursorNoteRef.current &&
                    osmdRef.current?.cursor
                ) {
                    try {
                        const cursor = osmdRef.current.cursor;
                        cursor.reset();
                        for (let i = 0; i < entry.noteIndex; i++) {
                            cursor.next();
                        }
                        cursor.show();
                        lastCursorNoteRef.current = entry.noteIndex;
                    } catch (e) { }
                }
            }

            cursorRafRef.current = requestAnimationFrame(updateCursor);
        }

        lastCursorNoteRef.current = -1;
        cursorRafRef.current = requestAnimationFrame(updateCursor);

        return () => {
            cancelAnimationFrame(cursorRafRef.current);
        };

    }, [isPlaying, isCountingIn, getElapsedBeats]);

    const resetPracticeState = () => {
        setActiveNoteIndex(null);
        activeNoteIndexRef.current = null;
        bestMidiPerNoteRef.current = new Map();
        lastJudgedNoteIndexRef.current = -1;
        lastCursorNoteRef.current = -1;
        clearAllNoteColors(containerRef.current);
        setCorrectNotes(0);
        setMissedNotes(0);

        if (osmdRef.current?.cursor) {
            try {
                osmdRef.current.cursor.hide();
                osmdRef.current.cursor.reset();
            } catch (e) { }
        }
    };

    const handleStart = () => {
        resetPracticeState();
        start();
    };

    useEffect(() => {

        const fetchSong = async () => {

            try {

                const token = localStorage.getItem("token");

                const res = await fetch(
                    `http://127.0.0.1:5000/api/songs/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 401) {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                    return;
                }

                if (!res.ok) {
                    throw new Error("Failed to load song");
                }

                const data = await res.json();
                const xmlText = data.content;

                const parsed = xml2js(xmlText, {
                    compact: false,
                    spaces: 2,
                });

                const extractedNotes =
                    extractNotesFromParsedXML(parsed);

                console.log("Extracted notes:", extractedNotes);
                console.log(
                    "Duration beats sample:",
                    extractedNotes.slice(0, 5).map(n => n.durationBeats)
                );

                setNotes(extractedNotes);
                setSong(data);

            } catch (err) {
                console.error("Error loading song:", err);
            }
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
            noteheadScaling: 1.2,
        });

        osmd.load(song.content)
            .then(() => {
                osmd.EngravingRules.SoftMaxMeasureWidth = 1200;
                osmd.zoom = 0.75;
                osmd.render();

                osmdRef.current = osmd;

                osmd.cursor.show();
                osmd.cursor.hide();

                console.log("OSMD rendered successfully");
            })
            .catch(err => console.error("OSMD load error:", err));

    }, [song]);

    const activeNote =
        activeNoteIndex != null ? notes[activeNoteIndex] : null;

    const expectedLabel = activeNote
        ? activeNote.isRest
            ? "Rest"
            : `${activeNote.step}${activeNote.alter === 1
                ? "#"
                : activeNote.alter === -1
                    ? "b"
                    : ""
            }${activeNote.octave}`
        : "—";

    const totalJudged = correctNotes + missedNotes;
    const accuracy = totalJudged > 0
        ? Math.round((correctNotes / totalJudged) * 100)
        : null;

    return (
        <div className="container-fluid mt-4">

            {/* Controls */}
            <div className="text-center mb-4">

                <button
                    className="btn btn-primary"
                    onClick={isPlaying ? stop : handleStart}
                >
                    {isPlaying ? "Stop Practice" : "Start Practice"}
                </button>

                <div className="mt-3 d-flex align-items-center justify-content-center gap-2">
                    <label className="form-label mb-0">BPM</label>
                    <input
                        type="number"
                        className="form-control w-auto"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                    />
                </div>

                {/* Count-in display */}
                {isCountingIn && countInBeat < 8 && (
                    <div className="mt-4">
                        <h1 style={{ fontSize: "6rem", fontWeight: "bold" }}>
                            {8 - countInBeat}
                        </h1>
                        <p className="text-muted">Get ready…</p>
                    </div>
                )}

                {/* Playing indicator */}
                {isPlaying && !isCountingIn && (
                    <h2 className="mt-3 text-success">♩ PLAY</h2>
                )}

            </div>

            {/* Stats */}
            <div className="d-flex gap-4 justify-content-center mb-3 text-center">

                <div>
                    <div className="text-muted small">Mic</div>
                    <div>{ready ? "✅" : "⏳"}</div>
                </div>

                <div>
                    <div className="text-muted small">Frequency</div>
                    <div>
                        {frequency ? `${frequency.toFixed(1)} Hz` : "—"}
                    </div>
                </div>

                <div>
                    <div className="text-muted small">Expected</div>
                    <div>{expectedLabel}</div>
                </div>

                <div>
                    <div className="text-muted small">Correct</div>
                    <div className="text-success fw-bold">{correctNotes}</div>
                </div>

                <div>
                    <div className="text-muted small">Missed</div>
                    <div className="text-danger fw-bold">{missedNotes}</div>
                </div>

                {accuracy != null && (
                    <div>
                        <div className="text-muted small">Accuracy</div>
                        <div className="fw-bold">{accuracy}%</div>
                    </div>
                )}

            </div>

            {/* Score */}
            <div
                className="score-container"
                ref={containerRef}
                style={{
                    width: "min(1200px, 90vw)",
                    minHeight: "400px",
                    margin: "0 auto",
                }}
            />

        </div>
    );
}

export default SongPage;