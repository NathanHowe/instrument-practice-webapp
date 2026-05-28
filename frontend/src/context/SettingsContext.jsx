import {
    createContext,
    useContext,
    useState,
} from "react";

import { instruments } from "../utils/instruments";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {

    const [instrument, setInstrument] = useState("flute");

    const instrumentConfig =
        instruments[instrument];

    const value = {
        instrument,
        setInstrument,

        transposition:
            instrumentConfig.transposition,

        clef:
            instrumentConfig.clef,

        minMidi:
            instrumentConfig.minMidi,

        maxMidi:
            instrumentConfig.maxMidi,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}