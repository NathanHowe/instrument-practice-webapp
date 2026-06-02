import { Link } from "react-router-dom";

const NavBar = ({ theme, toggleTheme, isLoggedIn, onLogout }) => {
    return (
        <nav className="navbar fixed-top navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">

                <Link className="navbar-brand" to="/">
                    PracticeApp
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>



                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/metronome">
                                Metronome
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/tuner">
                                Tuner
                            </Link>
                        </li>

                        <li className="nav-item">
                            <Link className="nav-link" to="/sight-reading">
                                Sight Reading
                            </Link>
                        </li>


                        {isLoggedIn && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/my-music">My Music</Link>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-link nav-link" onClick={onLogout}>
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <Link className="nav-link" to="/settings">
                                Settings
                            </Link>
                        </li>
                        {!isLoggedIn && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/signup">Sign Up</Link>
                                </li>
                            </>
                        )}

                    </ul>


                    <button
                        className="btn btn-outline-secondary"
                        onClick={toggleTheme}
                    >
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </button>

                </div>
            </div>
        </nav>
    );
};

export default NavBar;