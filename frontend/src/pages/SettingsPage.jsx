import { useSettings } from "../context/SettingsContext";
import { instruments } from "../utils/instruments";

export default function SettingsPage() {

  const {
    instrument,
    setInstrument,
  } = useSettings();

  return (
    <div className="container mt-5">
      <h1>Settings</h1>

      <div className="mt-4">
        <label className="form-label">
          Instrument
        </label>

        <select
          className="form-select"
          value={instrument}
          onChange={(e) =>
            setInstrument(e.target.value)
          }
        >
          {Object.entries(instruments).map(
            ([key, inst]) => (
              <option
                key={key}
                value={key}
              >
                {inst.name}
              </option>
            )
          )}
        </select>
      </div>
    </div>
  );
}