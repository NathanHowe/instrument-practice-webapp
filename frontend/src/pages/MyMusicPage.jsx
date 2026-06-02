import { useEffect, useState } from "react";
import SongCard from "../components/SongCard";
import { useNavigate } from "react-router-dom";

function MyMusicPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/songs/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();
      setSongs(data);
    } catch (err) {
      console.error("Failed to fetch songs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>My Music</h2>

      <button
        className="btn btn-primary mb-4"
        onClick={() => navigate("/create-song")}
      >
        + New Song
      </button>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : songs.length === 0 ? (
        <p className="text-muted">
          No songs yet. Upload one to get started!
        </p>
      ) : (
        <div className="row justify-content-center g-4">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyMusicPage;