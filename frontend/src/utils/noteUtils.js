const A4 = 440;

const NOTE_NAMES = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];

export function freqToNote(freq) {
    if (!freq) return null;

    const noteNumber =
        12 * Math.log2(freq / A4) + 69;

    const rounded = Math.round(noteNumber);

    const name = NOTE_NAMES[rounded % 12];
    const octave = Math.floor(rounded / 12) - 1;

    const perfectFreq =
        A4 * Math.pow(2, (rounded - 69) / 12);

    const cents =
        1200 * Math.log2(freq / perfectFreq);

    return {
        name,
        octave,
        cents,
        frequency: freq
    };
}