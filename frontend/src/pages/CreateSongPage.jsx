import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateSongPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            "http://127.0.0.1:5000/api/songs/",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        const data = await response.json();

        if (response.ok) {
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
                    <label className="form-label">Upload Sheet Music (.mxl)</label>

                    <input
                        type="file"
                        className="form-control"
                        accept=".mxl,.musicxml,.xml"
                        onChange={(e) => setFile(e.target.files[0])}
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
