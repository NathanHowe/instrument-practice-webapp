import { useEffect, useRef, useState } from "react";
import { autoCorrelate } from "../utils/pitchAlgorithm";

export default function usePitchDetector(audioContext, source) {
    const [frequency, setFrequency] = useState(null);

    const analyserRef = useRef(null);
    const bufferRef = useRef(null);
    const smoothFreqRef = useRef(null);
    const lastSignalTimeRef = useRef(0);

    useEffect(() => {
        if (!audioContext || !source) return;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        source.connect(analyser);

        analyserRef.current = analyser;
        bufferRef.current = new Float32Array(analyser.fftSize);

        const SMOOTHING = 0.85;
        const HOLD_TIME = 0.5; // seconds

        function update() {
            analyser.getFloatTimeDomainData(bufferRef.current);

            const freq = autoCorrelate(
                bufferRef.current,
                audioContext.sampleRate
            );

            if (freq && freq > 0) {
                lastSignalTimeRef.current = audioContext.currentTime;

                if (smoothFreqRef.current === null) {
                    smoothFreqRef.current = freq;
                } else {
                    smoothFreqRef.current =
                        smoothFreqRef.current * SMOOTHING +
                        freq * (1 - SMOOTHING);
                }

                setFrequency(smoothFreqRef.current);
            } else {
                
                if (audioContext.currentTime - lastSignalTimeRef.current > HOLD_TIME) {
                    smoothFreqRef.current = null;
                    setFrequency(null);
                } else {
                    setFrequency(smoothFreqRef.current);
                }

            }

            requestAnimationFrame(update);
        }

        const freq = autoCorrelate(
            bufferRef.current,
            audioContext.sampleRate
        );

        console.log("detected freq:", freq);

        update();
    }, [audioContext, source]);

    return frequency;
}