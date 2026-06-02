import { useRef, useState } from "react";

export default function useMetronome() {

    const audioCtxRef = useRef(null);

    const timerRef = useRef(null);

    const animationFrameRef = useRef(null);

    const nextNoteTime = useRef(0);

    const currentSubBeat = useRef(0);

    const startTimeRef = useRef(0);

    const isPlayingRef = useRef(false);

    // Absolute beat counter across the whole performance (post count-in)
    const performanceBeatRef = useRef(0);

    // Callback fired on every quarter-note beat after count-in
    const onBeatRef = useRef(null);

    const [isPlaying, setIsPlaying] =
        useState(false);

    const [bpm, setBpm] =
        useState(80);

    const [subdivision, setSubdivision] =
        useState("quarter");

    const [countInBeat, setCountInBeat] =
        useState(0);

    const [isCountingIn, setIsCountingIn] =
        useState(false);

    const COUNT_IN_BEATS = 8;

    const lookahead = 25;

    const scheduleAheadTime = 0.1;

    async function initializeAudio() {

        if (!audioCtxRef.current) {

            audioCtxRef.current =
                new AudioContext();
        }

        if (
            audioCtxRef.current.state ===
            "suspended"
        ) {

            await audioCtxRef.current.resume();
        }

        console.log(
            "Audio state:",
            audioCtxRef.current.state
        );
    }

    function getSubdivisionMultiplier() {

        switch (subdivision) {

            case "eighth":
                return 2;

            case "triplet":
                return 3;

            case "sixteenth":
                return 4;

            default:
                return 1;
        }
    }

    function playClick(time) {

        const ctx = audioCtxRef.current;

        if (!ctx) return;

        const osc =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        const subdivMult =
            getSubdivisionMultiplier();

        const isDownbeat =
            currentSubBeat.current %
            subdivMult === 0;

        osc.frequency.value =
            isDownbeat
                ? 2000
                : 1800;

        gain.gain.setValueAtTime(
            isDownbeat
                ? 1.0
                : 0.5,
            time
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.03
        );

        osc.connect(gain);

        gain.connect(ctx.destination);

        osc.start(time);

        osc.stop(time + 0.03);
    }

    function scheduleNotes() {

        const ctx =
            audioCtxRef.current;

        if (!ctx) return;

        while (
            nextNoteTime.current <
            ctx.currentTime +
            scheduleAheadTime
        ) {

            playClick(
                nextNoteTime.current
            );

            const secondsPerBeat =
                60.0 / bpm;

            const interval =
                secondsPerBeat /
                getSubdivisionMultiplier();

            // Fire onBeat callback only on quarter-note beats, after count-in
            // We bridge audio time → wall time via a setTimeout
            const isQuarterBeat =
                currentSubBeat.current %
                getSubdivisionMultiplier() === 0;

            const elapsedAtBeat =
                nextNoteTime.current -
                startTimeRef.current;

            const isAfterCountIn =
                elapsedAtBeat >=
                COUNT_IN_BEATS * (60.0 / bpm);

            if (
                isQuarterBeat &&
                isAfterCountIn &&
                onBeatRef.current
            ) {
                const delayMs =
                    (nextNoteTime.current -
                        ctx.currentTime) *
                    1000;

                const beatIndex =
                    performanceBeatRef.current;

                performanceBeatRef.current++;

                setTimeout(() => {
                    if (
                        isPlayingRef.current &&
                        onBeatRef.current
                    ) {
                        onBeatRef.current(
                            beatIndex
                        );
                    }
                }, Math.max(0, delayMs));
            }

            nextNoteTime.current +=
                interval;

            currentSubBeat.current++;
        }
    }

    function updateVisuals() {

        if (
            !audioCtxRef.current ||
            !isPlayingRef.current
        ) {
            return;
        }

        const elapsed =
            audioCtxRef.current.currentTime -
            startTimeRef.current;

        const beat =
            Math.floor(
                elapsed /
                (60 / bpm)
            );

        setCountInBeat(beat);

        if (
            beat >= COUNT_IN_BEATS
        ) {

            setIsCountingIn(false);
        }

        animationFrameRef.current =
            requestAnimationFrame(
                updateVisuals
            );
    }

    // Returns fractional performance beats elapsed since count-in ended.
    // Returns null if not playing or still counting in.
    function getElapsedBeats() {
        if (
            !audioCtxRef.current ||
            !isPlayingRef.current
        ) return null;

        const elapsed =
            audioCtxRef.current.currentTime -
            startTimeRef.current;

        const countInSeconds =
            COUNT_IN_BEATS * (60.0 / bpm);

        const performanceElapsed =
            elapsed - countInSeconds;

        if (performanceElapsed < 0) return null;

        return performanceElapsed / (60.0 / bpm);
    }

    async function start() {

        await initializeAudio();

        currentSubBeat.current = 0;

        performanceBeatRef.current = 0;

        nextNoteTime.current =
            audioCtxRef.current.currentTime;

        startTimeRef.current =
            audioCtxRef.current.currentTime;

        // playClick(
        //     audioCtxRef.current.currentTime
        // );

        setCountInBeat(0);

        setIsCountingIn(true);

        isPlayingRef.current = true;

        setIsPlaying(true);

        scheduleNotes();

        timerRef.current =
            setInterval(
                scheduleNotes,
                lookahead
            );

        updateVisuals();
    }

    function stop() {

        clearInterval(
            timerRef.current
        );

        cancelAnimationFrame(
            animationFrameRef.current
        );

        isPlayingRef.current = false;

        setIsPlaying(false);

        setIsCountingIn(false);

        setCountInBeat(0);
    }

    function toggle() {

        isPlaying
            ? stop()
            : start();
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

        countInBeat,
        isCountingIn,

        getElapsedBeats,

        // Attach a callback to fire on every quarter-note beat after count-in.
        // Receives beatIndex (0-based). Assign via: metronome.onBeatRef.current = fn
        onBeatRef,
    };
}