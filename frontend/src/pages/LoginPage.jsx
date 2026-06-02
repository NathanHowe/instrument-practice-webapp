import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

function LoginPage({ setIsLoggedIn }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { notify } = useNotification();

    // If the user was redirected here from a protected page, send them
    // back there after login. Otherwise go to /my-music.
    const from = location.state?.from?.pathname || "/my-music";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            notify("Please enter your email and password.", "warning");
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.access_token);
            setIsLoggedIn(true);
            notify("Login successful!", "success");
            navigate(from, { replace: true });
        } else {
            // Backend returns { message: "..." } — use that, not data.msg
            notify(data.message || "Login failed", "danger");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <h2 className="mb-4">Login</h2>

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

                <button type="submit" className="btn btn-primary w-100">
                    Login
                </button>
            </form>
        </div>
    );
}

export default LoginPage;