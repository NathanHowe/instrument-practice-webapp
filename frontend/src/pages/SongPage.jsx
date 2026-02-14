import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function SongPage() {
    const { id } = useParams();

    const [song, setSong] = useState(null);

    useEffect(() => {
        const fetchSong = async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://127.0.0.1:5000/api/songs/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSong(data);
            } else {
                alert("Failed to load song");
            }
        };

        fetchSong();
    }, [id]);

    if (!song) {
        return <div className="container mt-5">Loading...</div>;
    }

    return (
        <div className="container mt-5">
            <h2>Song Editor</h2>
            <h4>{song.title}</h4>
            <p>Song ID: {id}</p>
        </div>
    );
}

export default SongPage;
