import { useSettings } from "../context/SettingsContext";

export default function SettingsPage() {

  const {
    transposition,
    setTransposition,
  } = useSettings();

  return (
    <div className="container mt-5">
      <h1>Settings</h1>

      {/* Transposition */}
      <div className="mt-4">
        <label className="form-label">Instrument</label>
        <select
          className="form-select"
          value={transposition}
          onChange={(e) => setTransposition(Number(e.target.value))}
        >
          <option value={0}>Concert (C)</option>
          <option value={2}>Bb Instrument</option>
          <option value={9}>Eb Instrument</option>
        </select>
      </div>
    </div>
  );
}