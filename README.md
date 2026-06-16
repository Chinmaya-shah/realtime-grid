# 🎨 Pixel Board — Real-Time Shared Grid Sandbox

Pixel Board is a high-fidelity, real-time shared pixel board application where multiple online players can simultaneously capture cells on a 30x30 grid, customize their nicknames and board colors, view live leaderboard updates, and play across multiple custom rooms and game modes.

---

## 🚀 Live Demo & Hosting

- **Frontend (Cloudflare Pages)**: [https://realtime-grid.pages.dev/](https://realtime-grid.pages.dev/)
- **Backend (Hugging Face Spaces)**: [https://chinmayasha-realtime-grid-backend.hf.space](https://chinmayasha-realtime-grid-backend.hf.space)
- **GitHub Repository**: [https://github.com/Chinmaya-shah/realtime-grid](https://github.com/Chinmaya-shah/realtime-grid)

---

## 🛠️ Tech Stack & Rationale

### 1. Frontend: Next.js (React 19) & Vanilla CSS
- **Why Next.js**: Provides a highly structured React environment with static page export (`output: "export"`), making it extremely easy to host on Cloudflare Pages with zero server costs.
- **Why Vanilla CSS + Tailwind Custom Variables**: Created a custom **Neumorphic (Soft UI)** theme. Neumorphic styling relies on precise, dual shadow vectors (light and dark shadows casting from a virtual light source). Vanilla CSS utility classes combined with custom variables in `globals.css` provide maximum control over card shadows, embossed inputs, and dark/light mode transitions without bloating the runtime.

### 2. Backend: Node.js, Express & Socket.io
- **Why Socket.io**: Handled WebSockets with automatic reconnection, heartbeat/ping-pong checks, and room/namespace segmentation out-of-the-box. It provides an event-driven model suited for fast, bidirectional real-time updates.
- **Why Node.js/Express**: Extremely fast event-driven I/O loop that handles thousands of concurrent WebSocket connections efficiently under a single thread.

### 3. Database: SQLite3 with RAM caching
- **Why SQLite**: SQLite is self-contained and stores data in a local file (`database.db`), removing dependencies on external database clusters (like Postgres).
- **The RAM Cache Layer**: To solve file I/O latency under rapid clicks (e.g. 0.5s rapid fire mode), the server maintains an active memory-mapped cache (`Map`). Read requests are served instantly from RAM, while writes are handled asynchronously via SQLite, combining durability with sub-millisecond response times.

---

## 📡 Real-Time Synchronization Strategy

We designed a bidirectional WebSocket events layer:

```text
  [ Client A ]                                   [ Client B ]
        │                                              ▲
        │ emit("tile:capture", { tileId })            │
        ▼                                              │ broadcast("tile:updated")
┌──────────────────────────────────────────────────┐   │
│             Node.js Socket.io Server             │───┘
├──────────────────────────────────────────────────┤
│ 1. Validate Capture Cooldowns                    │
│ 2. Check Player Color Uniqueness                 │
│ 3. Update SQLite Database Table                  │
│ 4. Sync Memory Cache Map                         │
└──────────────────────────────────────────────────┘
```

1. **State Initialization**: Upon connecting, clients receive the `init:state` signal, loading the entire board grid, current active player coordinates, and chat history.
2. **Dynamic Capture Sync**: When a player clicks a cell, they emit a `tile:capture` request. The server validates the cooldown, updates the SQLite store, and broadcasts a `tile:updated` signal to the room namespace.
3. **Stale Closure Mitigations**: In React, state hooks evaluated inside asynchronous socket event handlers can suffer from stale closures (stale username/color). We solved this by using a mutable React Ref pointer (`currentUserRef`), ensuring that callbacks always read the latest user state.

---

## 🔒 Concurrency, Conflicts & Uniqueness

### 1. Player Color Uniqueness
- **Client-Side Lock**: Colors currently claimed by online users are mapped and disabled (rendered with a lock icon) in both the onboarding modal and customization panel.
- **Server-Side Enforcement**: If a race condition occurs, the server checks the color against active users. If taken, it drops the update and emits a `color:rejected` signal to the client, which alerts the user and rolls back the change.

### 2. Preoccupied Block Recoloring
- When a user changes their color, the server runs an atomic update: `UPDATE tiles SET ownerColor = ? WHERE ownerName = ?`.
- It updates the memory cache and broadcasts `tile:updated` events for all changed cells to the room. The board recolors instantly for all online users.

### 3. Cooldown Lockouts
- To prevent spam clicks or script captures, the server validates timestamps.
- If a user clicks during their cooldown, the server rejects the request and sends a `capture:rejected` alert, triggering a local cooldown animation.

---

## 🎨 UI & UX Craftsmanship
- **Clean Neumorphism**: Uses borderless card surfaces, dual-source drop shadows, and embossed input fields.
- **Layout Stability**: Added `.scrollbar-stable` to prevent scrollbar rendering from shifting cards.
- **No Accordions (Static Layout)**: Left sidebar sections (Profile, Statistics, Event Management, Missions, Game Modes, and Activity Console) are statically expanded to offer clear visual access.
- **Activity Log Console**: Features a real-time feed styled as a sunken terminal console. Changed the terminal background to white in light mode and zinc in dark mode to blend with cards.

---

## 🎁 Implemented Bonus Features

1. **Onboarding Modal**: A beautiful glassmorphic welcome overlay that forces new users to choose a unique color and nickname before playing.
2. **Game Mode Events**: Support for custom rooms using generating codes.
   - **Classic**: 5-second capture cooldowns.
   - **Rapid Fire**: 0.5-second capture cooldowns.
   - **Duo Battles**: Locked Team Red vs Team Blue.
   - **Squad Wars**: 4-faction battle (Red, Blue, Green, Yellow).
3. **Web Audio Sound Effects**: Generates 8-bit retro sound effects (capture, success, error, ready) dynamically on the fly using the browser's Web Audio API (zero external assets loaded).
4. **Achievements & Missions**: Dynamic quest tracker that parses board coordinates in real time.
5. **Leaderboard & Stats**: Tracks owned pixels and percentage domination.
6. **Dark/Light Theme**: Theme transitions with a floating settings dropdown.

---

## 📦 Project Structure

```text
realtime-grid/
├── backend/
│   ├── README.md            # HF Space configuration metadata
│   ├── Dockerfile           # HF Spaces Node Docker configuration
│   ├── database.db          # Persisted SQLite store
│   ├── server.js            # Node / Express / Socket.io server logic
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── globals.css  # Neumorphic styling tokens & classes
    │   │   ├── layout.tsx
    │   │   └── page.tsx     # Application dashboard layout
    │   └── components/
    │       ├── GridBoard.tsx     # Cell board (drag-gesture safe)
    │       ├── Leaderboard.tsx   # Live rankings & active players
    │       ├── ActivityLog.tsx   # Console feed for updates
    │       ├── ProfileWidget.tsx # User customizer & color palette
    │       ├── ChatWidget.tsx    # Live messaging layer
    │       ├── EventWidget.tsx   # Private rooms & game modes
    │       ├── GameModesWidget.tsx # Description of game modes
    │       ├── QuestsWidget.tsx  # Dynamic achievements/missions
    │       └── SoundManager.ts   # Web Audio synthesizer
    └── package.json
```

---

## 🛠️ Local Development

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```
