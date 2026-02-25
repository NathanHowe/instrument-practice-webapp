import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </NotificationProvider>
  </StrictMode>,
)
