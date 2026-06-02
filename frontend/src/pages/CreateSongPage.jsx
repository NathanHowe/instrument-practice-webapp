import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

function CreateSongPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const { notify } = useNotification();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            notify("Please select a file to upload.", "warning");
            return;
        }

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);

        const response = await fetch("http://127.0.0.1:5000/api/songs/", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        setUploading(false);

        if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
            return;
        }

        const data = await response.json();

        if (response.ok) {
            navigate(`/songs/${data.song.id}`);
        } else {
            notify(data.message || "Failed to upload song.", "danger");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 500 }}>
            <h2 className="mb-4">Upload Sheet Music</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">
                        File (.mxl, .musicxml, .xml)
                    </label>
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
                    disabled={uploading}
                >
                    {uploading ? "Uploading…" : "Upload Song"}
                </button>
            </form>
        </div>
    );
}

export default CreateSongPage;