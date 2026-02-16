import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { generateThumbnail } from "../utils/generateThumbnail";
import {getCachedThumbnail, saveThumbnail} from "../utils/thumbnailCache";

function SongCard({ song }) {
    const navigate = useNavigate();
    const [thumbnail, setThumbnail] = useState(null);
    const [title, setTitle] = useState("Untitled");
    

    useEffect(() => {
        if (!song?.content) return;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(
            song.content,
            "text/xml"
        );

        const workTitle =
            xmlDoc.querySelector("work-title")?.textContent ||
            xmlDoc.querySelector("movement-title")?.textContent;

        if (workTitle) setTitle(workTitle);

        const cached = getCachedThumbnail(song.id);

        if (cached) {
            setThumbnail(cached);
            return;
        }

        generateThumbnail(song.content).then((img) => {
            if (!img) return;

            saveThumbnail(song.id, img);
            setThumbnail(img);
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
