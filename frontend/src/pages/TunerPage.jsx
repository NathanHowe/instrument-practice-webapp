import useMicrophone from "../hooks/useMicrophone";
import usePitchDetector from "../hooks/usePitchDetector";
import { freqToNote } from "../utils/noteUtils";

export default function TunerPage() {
  const { audioContext, source, ready } = useMicrophone();
  const frequency = usePitchDetector(audioContext, source);

  const note = frequency ? freqToNote(frequency) : null;

  if (!ready) return <p>Starting microphone...</p>;

  return (
    <div className="text-center mt-5">
      <h1>Tuner</h1>

      <h2 style={{ fontSize: "64px" }}>
        {note ? `${note.name}${note.octave}` : "--"}
      </h2>

      <p>
        {frequency ? `${frequency.toFixed(2)} Hz` : "-- Hz"}
      </p>

      <CentsIndicator cents={note ? note.cents : null} />
    </div>
  );
}

function CentsIndicator({ cents }) {
  const displayCents = cents ?? 0;
  const clamped = Math.max(-50, Math.min(50, displayCents));
  const position = 50 + clamped;

  return (
    <div style={{ width: 300, margin: "20px auto" }}>
      <div
        style={{
          position: "relative",
          height: 10,
          background: "#ddd",
          borderRadius: 5
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${position}%`,
            top: -10,
            width: 2,
            height: 30,
            background: cents === null ? "#999" : "red",
            transform: "translateX(-50%)",
            transition: "left 0.08s linear"
          }}
        />
      </div>

      <p>
        {cents !== null ? `${cents.toFixed(1)} cents` : "-- cents"}
      </p>
    </div>
  );
}