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

    // Best MIDI detected during current note's window
    const bestMidiThisWindowRef = useRef(null);

    // Track which note index was last judged so we don't double-judge
    const lastJudgedNoteIndexRef = useRef(-1);

    const {
        start,
        stop,
        isPlaying,
        bpm,
        setBpm,
        countInBeat,
        isCountingIn,
        onBeatRef,
    } = useMetronome();

    const {
        audioContext,
        source,
        ready,
    } = useMicrophone();

    const frequency = usePitchDetector(audioContext, source);

    // -----------------------------------------------------------------------
    // Keep bestMidiThisWindow updated from latest frequency reading
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!isPlaying || isCountingIn || frequency == null) return;

        const midi = freqToMidi(frequency);

        // Keep the reading closest to the expected note's pitch.
        // Simple strategy: just keep the latest (hook is already smoothed).
        bestMidiThisWindowRef.current = midi;

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
            const note = notes[noteIndex];

            // --- Advance cursor ---
            if (osmdRef.current?.cursor) {
                // Move cursor to match noteIndex
                // OSMD cursor tracks its own position; we reset and step to match
                // (simpler than trying to do delta moves across variable durations)
                try {
                    const cursor = osmdRef.current.cursor;
                    cursor.reset();
                    for (let i = 0; i < noteIndex; i++) {
                        cursor.next();
                    }
                    cursor.show();
                } catch (e) {
                    // cursor may not be available on every build config
                }
            }

            setActiveNoteIndex(noteIndex);

            // --- Judge the PREVIOUS note window ---
            // We judge on the beat that ends a note's window, i.e. when we
            // advance past it. So judge noteIndex - 1 (the one we just left).
            const prevNoteIndex = noteIndex - 1;

            if (
                prevNoteIndex >= 0 &&
                prevNoteIndex !== lastJudgedNoteIndexRef.current
            ) {
                lastJudgedNoteIndexRef.current = prevNoteIndex;
                const prevNote = notes[prevNoteIndex];

                if (!prevNote.isRest) {
                    const expectedMidi = musicXmlNoteToMidi(prevNote);
                    const detectedMidi = bestMidiThisWindowRef.current;

                    const isCorrect =
                        detectedMidi != null &&
                        expectedMidi != null &&
                        Math.abs(detectedMidi - expectedMidi) <= 1;

                    const color = isCorrect ? "#22c55e" : "#ef4444";

                    colorNotehead(containerRef.current, prevNoteIndex, color);

                    if (isCorrect) {
                        setCorrectNotes(prev => prev + 1);
                    } else {
                        setMissedNotes(prev => prev + 1);
                    }
                }
            }

            // Reset window tracker for new note
            bestMidiThisWindowRef.current = null;
        };

        return () => {
            onBeatRef.current = null;
        };

    }, [notes, onBeatRef]);

    // -----------------------------------------------------------------------
    // Reset state when stopped
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!isPlaying) {
            setActiveNoteIndex(null);
            bestMidiThisWindowRef.current = null;
            lastJudgedNoteIndexRef.current = -1;
            clearAllNoteColors(containerRef.current);
            setCorrectNotes(0);
            setMissedNotes(0);

            if (osmdRef.current?.cursor) {
                try {
                    osmdRef.current.cursor.hide();
                    osmdRef.current.cursor.reset();
                } catch (e) { }
            }
        }
    }, [isPlaying]);

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
                    onClick={isPlaying ? stop : start}
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