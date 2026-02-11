import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components.jsx/Navbar.jsx";

import './App.css'

import Home from "./pages/HomePage.jsx";
import MetronomePage from "./pages/MetronomePage.jsx";
import TunerPage from "./pages/TunerPage";
import SightReadingPage from "./pages/SightReadingPage";
import MyMusicPage from "./pages/MyMusicPage";
import SettingsPage from "./pages/SettingsPage";

function App() {

  const [theme, setTheme] = useState("dark");

  // Apply theme to entire document
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };
 
  return (

    
    <BrowserRouter>
      <NavBar theme={theme} toggleTheme={toggleTheme} />


      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/metronome" element={<MetronomePage />} />
          <Route path="/tuner" element={<TunerPage />} />
          <Route path="/sight-reading" element={<SightReadingPage />} />
          <Route path="/my-music" element={<MyMusicPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
