import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // Initialize directly from localStorage — no useEffect flash
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    // Navigation to /login is handled by ProtectedRoute on the next render
  };

  return (
    <BrowserRouter>
      <NavBar
        theme={theme}
        toggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      <div className="container mt-4">
        <Routes>

          {/* Root: redirect based on auth state */}
          <Route
            path="/"
            element={
              isLoggedIn
                ? <Navigate to="/my-music" replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/tuner" element={<TunerPage />} />
          <Route path="/sight-reading" element={<SightReadingPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Protected routes */}
          <Route path="/my-music" element={
            <ProtectedRoute><MyMusicPage /></ProtectedRoute>
          } />
          <Route path="/songs/:id" element={
            <ProtectedRoute><SongPage /></ProtectedRoute>
          } />
          <Route path="/create-song" element={
            <ProtectedRoute><CreateSongPage /></ProtectedRoute>
          } />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;