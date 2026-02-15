import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { parseMusicXML } from "../utils/musicXmlParser";
import { generateThumbnail } from "../utils/generateThumbnail";

function SongCard({ song }) {
    const navigate = useNavigate();

    const [title, setTitle] = useState("Untitled");
    const [thumbnail, setThumbnail] = useState(null);

    useEffect(() => {
        if (!song?.content) return;

        // title
        const meta = parseMusicXML(song.content);
        setTitle(meta.title);

        // thumbnail
        generateThumbnail(song.content).then((img) => {
            if (img) setThumbnail(img);
        });
    }, [song]);

    return (
        <div
            className="card song-card m-3"
            style={{ width: "18rem", cursor: "pointer" }}
            onClick={() => navigate(`/songs/${song.id}`)}
        >
            <img
                className="card-img-top song-card-img"
                src={thumbnail || "https://placehold.co/300x150"}
                alt="Song preview"
            />

            <div className="card-body">
                <h5 className="card-title">{title}</h5>
            </div>
        </div>
    );
}

export default SongCard;
