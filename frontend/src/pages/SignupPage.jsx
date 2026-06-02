import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { notify } = useNotification();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            notify("Please enter your email and password.", "warning");
            return;
        }

        const response = await fetch(
            "http://127.0.0.1:5000/api/auth/register",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            notify("Account created! Please log in.", "success");
            navigate("/login");
        } else {
            // Backend returns { message: "..." } — not data.msg
            notify(data.message || "Signup failed", "danger");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <h2 className="mb-4">Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn btn-success w-100">
                    Sign Up
                </button>
            </form>
        </div>
    );
}

export default SignupPage;