import { useEffect, useRef, useState } from "react";

export default function useMicrophone() {
    const [ready, setReady] = useState(false);

    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        async function startMic() {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            const audioContext = new AudioContext();
            const source =
                audioContext.createMediaStreamSource(stream);

            audioContextRef.current = audioContext;
            sourceRef.current = source;

            setReady(true);
        }

        startMic();
    }, []);

    return {
        audioContext: audioContextRef.current,
        source: sourceRef.current,
        ready
    };
}