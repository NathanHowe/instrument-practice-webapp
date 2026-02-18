import useMetronome from "../hooks/useMetronome";
import MetronomeControls from "../components/MetronomeControls";

function MetronomePage() {
  const {
    bpm,
    setBpm,
    isPlaying,
    toggle,
    subdivision,
    setSubdivision
  } = useMetronome();

  return (
    <div className="container mt-5">
      <h2 className="text-center">Metronome</h2>

      <MetronomeControls
        bpm={bpm}
        setBpm={setBpm}
        isPlaying={isPlaying}
        toggle={toggle}
        subdivision={subdivision}
        setSubdivision={setSubdivision}
      />
    </div>
  );
}

export default MetronomePage;
