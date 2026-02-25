const A4 = 440;

const SHARP_NAMES =
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_NAMES =
    ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// export function freqToNote(freq) {
//     if (!freq) return null;

//     const noteNumber =
//         12 * Math.log2(freq / A4) + 69;

//     const rounded = Math.round(noteNumber);

//     const name = NOTE_NAMES[rounded % 12];
//     const octave = Math.floor(rounded / 12) - 1;

//     const perfectFreq =
//         A4 * Math.pow(2, (rounded - 69) / 12);

//     const cents =
//         1200 * Math.log2(freq / perfectFreq);

//     return {
//         name,
//         octave,
//         cents,
//         frequency: freq
//     };
// }
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