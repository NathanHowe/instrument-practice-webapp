# Instrument Practice Web App

A full-stack web app for musicians to upload sheet music and practice with real-time pitch detection and a metronome. The app listens to your microphone, tracks what you play, and highlights each note green or red based on whether you hit the right pitch in time.

---

## Features

- Upload MusicXML (`.mxl`, `.xml`, `.musicxml`) sheet music
- Sheet music rendered in the browser via OpenSheetMusicDisplay
- Real-time pitch detection via microphone (autocorrelation algorithm)
- Metronome with 8-beat count-in before playback begins
- Timing-aware note judgment supports most time signatures
- Correct notes highlighted green, incorrect notes highlighted red
- Moving cursor tracks the current note in real time, including sub-beat notes
- Practice automatically ends at the last note
- Colored noteheads stay visible after stopping so you can review mistakes
- Thumbnail preview generated for each song on the My Music page (cached in localStorage)
- Per-user song library with JWT authentication

---

## Project Structure

```
instrument_practice_webapp/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # App factory, extensions, blueprints
│   │   ├── auth.py            # Register and login routes
│   │   ├── models.py          # User and Song SQLAlchemy models
│   │   ├── routes.py          # Profile route
│   │   └── songs.py           # Song CRUD routes
│   ├── config.py              # Flask config (DB URI, secret keys)
│   ├── requirements.txt
│   └── run.py
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── SongCard.jsx
        ├── context/
        │   ├── NotificationContext.jsx
        │   └── SettingsContext.jsx
        ├── hooks/
        │   ├── useMetronome.js
        │   ├── useMicrophone.js
        │   └── usePitchDetector.js
        ├── pages/
        │   ├── CreateSongPage.jsx
        │   ├── LoginPage.jsx
        │   ├── MyMusicPage.jsx
        │   ├── SignupPage.jsx
        │   ├── SongPage.jsx
        │   └── SettingsPage.jsx
        ├── utils/
        │   ├── generateMusicXML.js
        │   ├── generateThumbnail.js
        │   ├── instruments.js
        │   ├── musicXmlParser.js
        │   ├── noteUtils.js
        │   ├── pitchAlgorithm.js
        │   ├── staffMap.js
        │   └── thumbnailCache.js
        ├── App.jsx
        └── main.jsx
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A browser that supports the Web Audio API (Chrome recommended for microphone access)

---

### Backend Setup

```bash
cd instrument_practice_webapp/backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask development server
python run.py
```

The API will be available at `http://127.0.0.1:5000`.

The SQLite database (`app.db`) is created automatically in `backend/instance/` on first run.

---

### Frontend Setup

```bash
cd instrument_practice_webapp/frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

All routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | No | Create a new account |
| POST | `/auth/login` | No | Log in, receive a JWT |

### Songs — `/api/songs`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/songs/` | Yes | Get all songs for the logged-in user |
| POST | `/songs/` | Yes | Upload a new song (multipart form, field: `file`) |
| GET | `/songs/<id>` | Yes | Get a single song by ID |
| DELETE | `/songs/<id>` | Yes | Delete a song |

### Profile — `/api`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/profile` | Yes | Get the logged-in user's email and ID |

All authenticated routes require an `Authorization: Bearer <token>` header. Tokens expire after 7 days.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| UI | Bootstrap 5 |
| Sheet music rendering | OpenSheetMusicDisplay (OSMD) |
| MusicXML parsing | xml-js |
| Audio | Web Audio API (AudioContext, AnalyserNode) |
| Pitch detection | Autocorrelation (custom implementation) |
| Backend | Flask, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS |
| Database | SQLite (via SQLAlchemy) |
| Auth | JWT (JSON Web Tokens) |

---

## Supported Instruments

Transposition and clef are handled automatically for each instrument:

| Instrument | Transposition | Clef |
|-----------|--------------|------|
| Flute | Concert pitch | Treble |
| Bb Clarinet | +2 semitones | Treble |
| Bb Trumpet | +2 semitones | Treble |
| Eb Alto Sax | +9 semitones | Treble |
| Trombone | Concert pitch | Bass |
| Bb Baritone (Treble) | +14 semitones | Treble |
| Baritone (Bass) | Concert pitch | Bass |
| Tuba | Concert pitch | Bass |

More instruments can be added by adding to the frontend\src\utils\instruments.js file.

---

## Supported File Formats

| Format | Extension |
|--------|-----------|
| Compressed MusicXML | `.mxl` |
| Uncompressed MusicXML | `.musicxml`, `.xml` |
