import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateSongPage() {
    const [title, setTitle] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://127.0.0.1:5000/api/songs/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title,
                    content: {
                        tempo: 120,
                        measures: [],
                    },
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            // redirect to newly created song
            navigate(`/songs/${data.song.id}`);
        } else {
            alert("Failed to create song");
        }
    };

    return (
        <div className="container mt-5">
            <h2>Create New Song</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">
                        Song Title
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-success"
                >
                    Create Song
                </button>
            </form>
        </div>
    );
}

export default CreateSongPage;
