const A4 = 440;

const SHARP_NAMES =
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_NAMES =
    ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export function freqToMidi(freq) {
    return Math.round(69 + 12 * Math.log2(freq / 440));
}

export function transposeNote(note, semitones) {
    if (!note) return null;

    const midi = note.midi + semitones;

    return {
        ...note,
        midi
    };
}

export function midiToNote(midi, preferFlats = false) {
    const names = preferFlats ? FLAT_NAMES : SHARP_NAMES;

    return {
        name: names[midi % 12],
        octave: Math.floor(midi / 12) - 1,
        midi
    };
}

export function musicXmlNoteToMidi(note) {

    if (
        !note ||
        note.isRest ||
        note.step == null ||
        note.octave == null
    ) {
        return null;
    }

    const stepOffsets = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
    };

    const alter = note.alter || 0;

    return (
        (note.octave + 1) * 12 +
        stepOffsets[note.step] +
        alter
    );
}