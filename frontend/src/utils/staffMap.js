export const STAFF_LIMITS = {
    treble: {
        topLine: 4,     // F5
        bottomLine: -4  // E4
    },
    bass: {
        topLine: 6,     // A3
        bottomLine: -8  // G2
    }
};

const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"];

function letterIndex(letter) {
    return LETTER_ORDER.indexOf(letter);
}

function calcSteps(noteName, octave, reference) {
    const noteLetter = noteName[0];
    const refLetter = reference.note;

    const letterDiff =
        letterIndex(noteLetter) - letterIndex(refLetter);

    const octaveDiff =
        (octave - reference.octave) * 7;

    return letterDiff + octaveDiff;
}

const TREBLE_REF = { note: "B", octave: 4 };
const BASS_REF = { note: "D", octave: 2 };

export function getStaffInfo(note) {
    if (!note) return null;

    const name = note.name.replace("#", "").replace("b", "");
    const accidental =
        note.name.includes("#") ? "sharp" :
            note.name.includes("b") ? "flat" : null;

    const useBass = note.octave < 4;

    const ref = useBass ? BASS_REF : TREBLE_REF;

    const steps = calcSteps(name, note.octave, ref);

    return {
        clef: useBass ? "bass" : "treble",
        steps,
        accidental
    };
}