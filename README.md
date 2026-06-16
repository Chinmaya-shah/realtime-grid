# 🎨 Real-Time Shared Board (Pixel Grid Sandbox)

A minimalist, high-fidelity real-time shared pixel board application matching the dark-slate-and-coral theme. Multiple players can capture cells/pixels on a 30x30 grid simultaneously, see changes instantly, track rankings on a live leaderboard, customize their profile nickname & colors, and see activity feed logs in real-time.

Built as a modern full-stack application with a Next.js frontend and a Node.js/Express/Socket.io backend, styled using vanilla CSS for custom neumorphic elements.

---

## 🚀 Live Demo & Hosting

- **Frontend (Cloudflare Pages)**: [https://realtime-grid.pages.dev/](https://realtime-grid.pages.dev/)
- **Backend (Hugging Face Spaces)**: [https://chinmayasha-realtime-grid-backend.hf.space](https://chinmayasha-realtime-grid-backend.hf.space)

---

## 📦 Project Structure

```text
realtime-grid/
├── backend/
│   ├── README.md            # Hugging Face Space Metadata
│   ├── Dockerfile           # HF Spaces Deployment Docker Configuration
│   ├── database.db          # SQLite persisted file (auto-generated)
│   ├── server.js            # Node.js / Express / Socket.io server
│   ├── test-client.js       # Automated E2E verification test client
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── globals.css  # Neumorphic styling tokens & variables
    │   │   ├── layout.tsx
    │   │   └── page.tsx     # Main application dashboard
    │   └── components/
    │       ├── GridBoard.tsx     # Panning/Zooming cell board
    │       ├── Leaderboard.tsx   # Ownership stats & online users
    │       ├── ActivityLog.tsx   # Console feed for actions
    │       ├── ProfileWidget.tsx # User customization & cooldown
    │       ├── ChatWidget.tsx    # Live room-based chat
    │       ├── EventWidget.tsx   # Custom room setup (Classic, Rapid, Duo, Squad)
    │       ├── GameModesWidget.tsx # Description of game modes
    │       ├── QuestsWidget.tsx  # Interactive user achievements
    │       └── SoundManager.ts   # Web Audio synthesized sound effects
    ├── next.config.ts       # Next.js Static Export Configuration
    └── package.json
```

---

## 🛠️ Local Development

### Prerequisites
Make sure you have **Node.js** (v18+) and **NPM** installed.

### 1. Backend Server Setup
Navigate to the backend directory, install dependencies, and start the development server:
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

To run E2E automated websocket tests:
```bash
node test-client.js
```

### 2. Frontend Next.js Setup
Open a new terminal, navigate to the frontend directory, install dependencies, and start the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🎨 Key Features & Design Choices

1. **Modern Neumorphism Aesthetics**: Borderless rectangular cards with soft 12px rounded corners that cleanly blend light and dark neumorphic shadows.
2. **Layout Stability**: Left sidebar uses a stable scrollbar gutter to prevent layout shifts/shrinking when sections are expanded.
3. **Web Audio Synthesized Audio**: Leverages the Web Audio API to synthesize custom 8-bit sound effects (capture sound, success chord, error buzzer, ready ding) dynamically on the client-side, eliminating external asset dependencies.
4. **Multi-room Gameplay Modes**:
   - **Classic**: 5-second cooldown per capture.
   - **Rapid Fire**: 0.5-second cooldown for ultra-fast clicking.
   - **Duo Battles**: Automated team color locking (Red vs Blue).
   - **Squad Wars**: 4-faction clash (Red, Blue, Green, Yellow).
5. **Interactive Quests**: Live achievements (First Conquest, Grid Dominator, Corner Conqueror, Center Strike, Double Agent) evaluated in real-time.
6. **SQLite Database Persistence**: Database entries are saved to a SQLite database and cached in memory for zero-latency lookups, surviving server restarts.

---

## ☁️ Deployment

### Backend (Hugging Face Spaces)
The backend is packaged into a Docker container. Hugging Face Spaces runs the container as a non-root user (UID `1000`/`node`). The `Dockerfile` has been explicitly configured to pre-create and set write permissions on the SQLite database so that the database is writeable on startup.

### Frontend (Cloudflare Pages)
Next.js is configured with `output: "export"` to build the frontend as a static site. The production build takes the environment variable `NEXT_PUBLIC_SOCKET_URL` (in this case `https://chinmayasha-realtime-grid-backend.hf.space`) and deploys to Cloudflare Pages.
