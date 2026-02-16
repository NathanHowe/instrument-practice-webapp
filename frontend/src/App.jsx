import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar.jsx";

import './App.css'

import Home from "./pages/HomePage.jsx";
import MetronomePage from "./pages/MetronomePage.jsx";
import TunerPage from "./pages/TunerPage";
import SightReadingPage from "./pages/SightReadingPage";
import MyMusicPage from "./pages/MyMusicPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SongPage from "./pages/SongPage";
import CreateSongPage from "./pages/CreateSongPage";

function App() {

  const [theme, setTheme] = useState("dark");

  // Apply theme to entire document
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };
 
  return (

    
    <BrowserRouter>
      <NavBar theme={theme} toggleTheme={toggleTheme} isLoggedIn={isLoggedIn} onLogout={handleLogout} />


      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/tuner" element={<TunerPage />} />
          <Route path="/sight-reading" element={<SightReadingPage />} />
          <Route path="/my-music" element={<MyMusicPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/songs/:id" element={<SongPage />} />
          <Route path="/create-song" element={<CreateSongPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
