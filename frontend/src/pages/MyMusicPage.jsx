import { useEffect, useState } from "react";
import SongCard from "../components.jsx/SongCard";
import { useNavigate } from "react-router-dom";

function MyMusicPage() {
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://127.0.0.1:5000/api/songs/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setSongs(data);
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


      <div className="row justify-content-center g-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}

export default MyMusicPage;
