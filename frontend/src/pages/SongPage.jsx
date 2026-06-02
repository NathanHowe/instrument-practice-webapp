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

// ---------------------------------------------------------------------------
// Build a flat beat-timeline from the extracted notes.
// Each entry: { noteIndex, startBeat, endBeat }
// Rests are included so the beat clock stays aligned — we just don't judge them.
// ---------------------------------------------------------------------------
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

// Given the current performance beat, find which timeline entry is "active"
function findActiveEntry(timeline, beatIndex) {
    // The note whose window contains beatIndex
    for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].startBeat <= beatIndex) {
            return timeline[i];
        }
    }
    return timeline[0] ?? null;
}

// ---------------------------------------------------------------------------
// Colour a notehead in the OSMD SVG by note index.
// OSMD renders noteheads as <g class="vf-notehead"> elements in order.
// We grab them all and index into the list.
// ---------------------------------------------------------------------------
function colorNotehead(containerEl, noteIndex, color) {
    if (!containerEl) return;
    // VexFlow noteheads: each notehead group
    const heads = containerEl.querySelectorAll(
        "g.vf-notehead path, g.vf-notehead use"
    );
    // OSMD may render one entry per notehead; for single-voice music this
    // matches our noteIndex directly (rests also generate a glyph).
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function SongPage() {

    const { id } = useParams();

    const containerRef = useRef(null);
    const osmdRef = useRef(null);

    const [song, setSong] = useState(null);
    const [notes, setNotes] = useState([]);

    // Beat-aligned timeline built from notes
    const timelineRef = useRef([]);

    // Current active note index (for display)
    const [activeNoteIndex, setActiveNoteIndex] = useState(null);

    // Score result counters
    const [correctNotes, setCorrectNotes] = useState(0);
    const [missedNotes, setMissedNotes] = useState(0);

    // Best MIDI detected per note index during its window
    const bestMidiPerNoteRef = useRef(new Map());

    // Track which note index was last judged so we don't double-judge
    const lastJudgedNoteIndexRef = useRef(-1);

    // Track active note index as a ref too (for use inside frequency effect)
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

    // Stable ref to stop() so the beat callback closure never goes stale
    const stopRef = useRef(stop);
    useEffect(() => { stopRef.current = stop; }, [stop]);

    const {
        audioContext,
        source,
        ready,
    } = useMicrophone();

    const frequency = usePitchDetector(audioContext, source);

    // -----------------------------------------------------------------------
    // Keep bestMidiPerNote updated from latest frequency reading.
    // Each sample is stored against whichever note is currently active.
    // We keep only the most recent reading per note (hook is already smoothed).
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!isPlaying || isCountingIn || frequency == null) return;

        const midi = freqToMidi(frequency);
        const idx = activeNoteIndexRef.current;

        if (idx != null) {
            bestMidiPerNoteRef.current.set(idx, midi);
        }

    }, [frequency, isPlaying, isCountingIn]);

    // -----------------------------------------------------------------------
    // Wire the beat callback once the timeline and OSMD are ready
    // -----------------------------------------------------------------------
    useEffect(() => {

        if (notes.length === 0) return;

        const timeline = buildBeatTimeline(notes);
        timelineRef.current = timeline;

        onBeatRef.current = (beatIndex) => {

            const entry = findActiveEntry(timeline, beatIndex);
            if (!entry) return;

            const { noteIndex } = entry;

            // Update both state (for display) and ref (for frequency sampling)
            setActiveNoteIndex(noteIndex);
            activeNoteIndexRef.current = noteIndex;

            // --- Judge ALL notes whose windows have closed since last beat ---
            // This handles sub-beat notes (e.g. two quarter notes in one beat
            // of cut time) that were skipped between beat ticks.
            const firstUnjudged = lastJudgedNoteIndexRef.current + 1;

            // Judge everything up to but not including the note now playing
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

            // --- End of song ---
            // The last note's window has closed when beatIndex >= its endBeat.
            const lastEntry = timeline[timeline.length - 1];
            if (lastEntry && beatIndex >= lastEntry.endBeat) {
                // Judge the final note if not yet judged
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

        }; // end onBeatRef.current

        return () => {
            onBeatRef.current = null;
        };

    }, [notes, onBeatRef]);

    // -----------------------------------------------------------------------
    // rAF loop: move OSMD cursor to the correct note based on exact audio time.
    // Runs every animation frame during playback so sub-beat notes get the
    // cursor even when the beat callback hasn't fired yet.
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Reset state when a new practice session STARTS (not when it stops),
    // so the player can review colored noteheads after stopping.
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Fetch song + parse notes
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Render OSMD once song is loaded
    // -----------------------------------------------------------------------
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

                // Initialize cursor but keep it hidden until practice starts
                osmd.cursor.show();
                osmd.cursor.hide();

                console.log("OSMD rendered successfully");
            })
            .catch(err => console.error("OSMD load error:", err));

    }, [song]);

    // -----------------------------------------------------------------------
    // Derived display values
    // -----------------------------------------------------------------------
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
                    <div>{ready ? "✓" : "X"}</div>
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