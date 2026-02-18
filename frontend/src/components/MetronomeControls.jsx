// import { ReactComponent as QuarterNote } from "../assets/react.svg";
// import { ReactComponent as EighthNotes } from "../assets/eighth_notes.svg";
// import { ReactComponent as Triplet } from "../assets/triplet.svg";
// import { ReactComponent as SixteenthNotes } from "../assets/sixteenth_notes.svg";

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
                    {/* TODO: Fix Icon */}
                    .
                </button>

                <button
                    className={`sub-box ${subdivision === "eighth" ? "active" : ""}`}
                    onClick={() => setSubdivision("eighth")}
                >
                    .
                </button>

                <button
                    className={`sub-box ${subdivision === "triplet" ? "active" : ""}`}
                    onClick={() => setSubdivision("triplet")}
                >
                    .
                </button>

                <button
                    className={`sub-box ${subdivision === "sixteenth" ? "active" : ""}`}
                    onClick={() => setSubdivision("sixteenth")}
                >
                    .
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
