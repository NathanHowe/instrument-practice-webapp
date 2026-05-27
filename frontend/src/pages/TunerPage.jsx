import { useState } from "react";
import useMicrophone from "../hooks/useMicrophone";
import usePitchDetector from "../hooks/usePitchDetector";
import { useSettings } from "../context/SettingsContext";
import { freqToMidi, midiToNote } from "../utils/noteUtils";
import StaffDisplay from "../components/StaffDisplay";

export default function TunerPage() {
  const { audioContext, source, ready } = useMicrophone();
  const frequency = usePitchDetector(audioContext, source);

  const { transposition } = useSettings();

  const [preferFlats, setPreferFlats] = useState(() => {
    return localStorage.getItem("preferFlats") === "true";
  });


  const concertMidi =
    frequency ? freqToMidi(frequency) : null;

  const concertNote =
    concertMidi !== null
      ? midiToNote(concertMidi, preferFlats)
      : null;

  const writtenNote =
    concertMidi !== null
      ? midiToNote(concertMidi + transposition, preferFlats)
      : null;

  let cents = null;

  if (concertMidi !== null && frequency) {
    const nearestFreq =
      440 * Math.pow(2, (concertMidi - 69) / 12);

    cents =
      1200 *
      Math.log2(frequency / nearestFreq);
  }

  if (!ready) return <p>Starting microphone...</p>;

  return (
    <div className="text-center mt-5">
      <h1>Tuner</h1>

      <StaffDisplay note={writtenNote || null} />
      <h2>
        Concert:{" "}
        {concertNote
          ? `${concertNote.name}${concertNote.octave}`
          : "--"}
      </h2>

      <h2>
        Written:{" "}
        {writtenNote
          ? `${writtenNote.name}${writtenNote.octave}`
          : "--"}
      </h2>

      <p>
        {frequency
          ? `${frequency.toFixed(2)} Hz`
          : "-- Hz"}
      </p>

      <CentsIndicator cents={cents} />

      <div className="d-flex justify-content-center gap-3 mt-4">

        <button
          className={`sub-box ${!preferFlats ? "active" : ""}`}
          onClick={() => setPreferFlats(false)}
        >
          <span className="note-icon">♯</span>
        </button>

        <button
          className={`sub-box ${preferFlats ? "active" : ""}`}
          onClick={() => setPreferFlats(true)}
        >
          <span className="note-icon">♭</span>
        </button>

      </div>
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
        {cents !== null
          ? `${cents.toFixed(1)} cents`
          : "-- cents"}
      </p>

    </div>

    
  );
}