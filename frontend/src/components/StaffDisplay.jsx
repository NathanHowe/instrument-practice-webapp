import TrebleStaff from "../assets/treble_clef.svg?react";
import BassStaff from "../assets/bass_clef.svg?react";
import NoteHead from "../assets/quarter_note.svg?react";

/*
  Staff logic:
  - Reference note = F4 (first space in treble clef)
  - MIDI 65
  - Movement is based on STAFF STEPS (line/space),
    not semitones.
*/

export default function StaffDisplay({ midi }) {
    console.log("Rendering StaffDisplay with MIDI:", midi);
    const useBass = midi !== null && midi < 60;

    // ---------- VISUAL TUNING CONSTANTS ----------
    const REFERENCE_MIDI = 65; // F4
    const REFERENCE_Y = 39;   // vertical position of first space
    const STEP_HEIGHT = 12;     // distance between line/space

    // ---------- HELPER ----------
    // Converts MIDI → diatonic staff steps
    function midiToStaffSteps(m) {
        // C D E F G A B
        const LETTER_INDEX = [
            0, // C
            0, // C#
            1, // D
            1, // D#
            2, // E
            3, // F
            3, // F#
            4, // G
            4, // G#
            5, // A
            5, // A#
            6  // B
        ];

        const octave = Math.floor(m / 12) - 1;
        const letter = LETTER_INDEX[m % 12];

        return octave * 7 + letter;
    }

    // ---------- POSITION CALCULATION ----------
    let y = REFERENCE_Y;

    if (midi !== null) {
        const referenceSteps = midiToStaffSteps(REFERENCE_MIDI);
        const noteSteps = midiToStaffSteps(midi);
        const MAX_STEPS = 45;   // above staff
        const MIN_STEPS = 25;  // below staff
        console.log("Note steps:", noteSteps);

        if (noteSteps < MAX_STEPS && noteSteps > MIN_STEPS) {
            y =
                REFERENCE_Y -
                (noteSteps - referenceSteps) * STEP_HEIGHT;
        }
    }   

    return (
        <div className="staff-wrapper">
            {/* STAFF BACKGROUND */}
            {useBass ? (
                <BassStaff className="staff-svg" />
            ) : (
                <TrebleStaff className="staff-svg" />
            )}

            {/* NOTE */}
            {midi !== null && (
                <NoteHead
                    className="note-head"
                    style={{
                        position: "absolute",
                        top: `${y}px`,
                        left: "50%",

                    }}
                />
            )}
        </div>
    );
}