import { useRef, useState } from "react";

export default function useMetronome() {
    const audioCtxRef = useRef(null);
    const timerRef = useRef(null);
    const nextNoteTime = useRef(0);
    const currentSubBeat = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [bpm, setBpm] = useState(80);
    const [subdivision, setSubdivision] = useState("quarter");

 

    const lookahead = 25;
    const scheduleAheadTime = 0.1; 
    
    function getSubdivisionMultiplier() {
        switch (subdivision) {
            case "eighth": return 2;
            case "triplet": return 3;
            case "sixteenth": return 4;
            default: return 1; // quarter
        }
    }

    function playClick(time) {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const subdivMult = getSubdivisionMultiplier();

        const isDownbeat =
            currentSubBeat.current % subdivMult === 0;

        if (isDownbeat) {
            // Strong click
            osc.frequency.value = 2000;
            gain.gain.value = 1.0;
        } else {
            // Soft subdivision click
            osc.frequency.value = 1800;
            gain.gain.value = 0.5;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.03);
    }

    function scheduleNotes() {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        while (
            nextNoteTime.current <
            ctx.currentTime + scheduleAheadTime
        ) {
            playClick(nextNoteTime.current);

            const secondsPerBeat = 60.0 / bpm;
            const interval =
                secondsPerBeat / getSubdivisionMultiplier();

            nextNoteTime.current += interval;

            currentSubBeat.current++;
        }
    }

    function start() {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }

        audioCtxRef.current.resume();

        currentSubBeat.current = 0;
        nextNoteTime.current = audioCtxRef.current.currentTime;

        timerRef.current = setInterval(scheduleNotes, lookahead);

        setIsPlaying(true);
    }

    function stop() {
        clearInterval(timerRef.current);
        setIsPlaying(false);
    }

    function toggle() {
        isPlaying ? stop() : start();
    }

    return {
        bpm,
        setBpm,
        isPlaying,
        toggle,
        start,
        stop,
        subdivision,
        setSubdivision,
    };
}
