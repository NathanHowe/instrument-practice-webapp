import QuarterNote  from "../assets/quarter_note.svg?react";
import EighthNotes from "../assets/eighth_notes.svg?react";
import Triplet from "../assets/triplet_notes.svg?react";
import SixteenthNotes from "../assets/sixteenth_notes.svg?react";

export default function MetronomeControls({
    bpm,
    setBpm,
    isPlaying,
    toggle,
    subdivision,
    setSubdivision
}) {
    return (
        <div className="text-center">
            <h3>{bpm} BPM</h3>

            <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
            />

            <div className="d-flex justify-content-center gap-3 mt-3">

                <button 
                    className={`sub-box ${subdivision === "quarter" ? "active" : ""}`}
                    onClick={() => setSubdivision("quarter")}
                >

                    <QuarterNote className="note-icon" />

                </button>

                <button
                    className={`sub-box ${subdivision === "eighth" ? "active" : ""}`}
                    onClick={() => setSubdivision("eighth")}
                >
                    <EighthNotes className="note-icon" />
                </button>

                <button
                    className={`sub-box ${subdivision === "triplet" ? "active" : ""}`}
                    onClick={() => setSubdivision("triplet")}
                >
                    <Triplet className="note-icon" />
                </button>

                <button
                    className={`sub-box ${subdivision === "sixteenth" ? "active" : ""}`}
                    onClick={() => setSubdivision("sixteenth")}
                >
                    <SixteenthNotes className="note-icon" />
                </button>

            </div>


            <div className="mt-3">
                <button
                    className="btn btn-primary"
                    onClick={toggle}
                >
                    {isPlaying ? "Stop" : "Start"}
                </button>
            </div>
        </div>
    );
}
