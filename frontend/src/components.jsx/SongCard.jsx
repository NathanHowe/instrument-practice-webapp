import { useNavigate } from "react-router-dom";

function SongCard({ song }) {
    const navigate = useNavigate();

    return (
        <div
            className="card song-card m-3"
            style={{ width: "18rem", cursor: "pointer" }}
            onClick={() => navigate(`/songs/${song.id}`)}
        >
            <img
                className="card-img-top song-card-img"
                src="https://placehold.co/300x150"
                alt="Song preview"
            />

            <div className="card-body">
                <h5 className="card-title">{song.title}</h5>
            </div>
        </div>
    );
}

export default SongCard;
