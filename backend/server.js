import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Setup SQLite Database
const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS tiles (
      id TEXT PRIMARY KEY,
      ownerName TEXT,
      ownerColor TEXT,
      capturedAt INTEGER
    )
  `, (err) => {
    if (err) {
      console.error("Error creating tiles table:", err.message);
    } else {
      console.log("Tiles database table initialized.");
    }
  });
}

// In-Memory state caches
const activeUsers = new Map(); // socket.id -> { username, color, lastCaptureTime, roomId }
const gridCache = new Map(); // namespacedTileId (e.g. roomId:r-c) -> { ownerName, ownerColor, capturedAt }
const chatHistory = new Map(); // roomId -> Array<{ username, color, message, timestamp }>

// Load database grid into cache on startup
function loadGridIntoCache() {
  db.all("SELECT id, ownerName, ownerColor, capturedAt FROM tiles", [], (err, rows) => {
    if (err) {
      console.error("Error querying tiles:", err.message);
      return;
    }
    rows.forEach((row) => {
      gridCache.set(row.id, {
        ownerName: row.ownerName,
        ownerColor: row.ownerColor,
        capturedAt: row.capturedAt
      });
    });
    console.log(`Loaded ${gridCache.size} tiles from database into cache.`);
  });
}

// Wait brief moment for DB init, then load cache
setTimeout(loadGridIntoCache, 500);

// Basic Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", activeUsersCount: activeUsers.size, tilesCaptured: gridCache.size });
});

// Color palettes for new users
const COLOR_PALETTE = [
  "#ff0055", // Neon Crimson / Pink
  "#00e5ff", // Electric Cyan
  "#00ff66", // Spring Neon Green
  "#ff9900", // Bright Gold / Orange
  "#cc00ff", // Vibrant Purple
  "#3366ff", // Electric Royal Blue
  "#ff3300", // Vibrant Red-Orange
  "#00ffcc", // Hyper Neon Teal
  "#ff00cc", // Rich Magenta
  "#e91e63"  // Hot Pink
];

function getRandomPaletteColor() {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

function getUniqueRandomColor(activeUsersMap) {
  const activeColors = new Set(Array.from(activeUsersMap.values()).map(u => u.color.toLowerCase()));
  // Try to find an unused color in the palette first
  const availablePalette = COLOR_PALETTE.filter(c => !activeColors.has(c.toLowerCase()));
  if (availablePalette.length > 0) {
    return availablePalette[Math.floor(Math.random() * availablePalette.length)];
  }
  // If all palette colors are taken, generate a random color that is not taken
  while (true) {
    const hex = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    if (!activeColors.has(hex.toLowerCase())) {
      return hex;
    }
  }
}

// Real-Time Socket Connections
io.on("connection", (socket) => {
  const ip = socket.handshake.address;

  // Count concurrent connections from this IP address
  let ipCount = 0;
  for (const [_, client] of io.of("/").sockets) {
    if (client.handshake.address === ip) {
      ipCount++;
    }
  }

  if (ipCount > 5) {
    console.log(`Connection rejected: too many connections from IP ${ip}`);
    socket.emit("error", "Too many connections from this IP address. Limit is 5.");
    socket.disconnect(true);
    return;
  }

  console.log(`Socket connected: ${socket.id} (IP: ${ip}, active: ${ipCount})`);

  // Create random user profile - initially in 'global' room
  const userId = Math.floor(100 + Math.random() * 900);
  const username = `Explorer-${userId}`;
  const color = getUniqueRandomColor(activeUsers);
  const userProfile = { username, color, lastCaptureTime: 0, roomId: "global" };
  
  activeUsers.set(socket.id, userProfile);
  socket.join("global");

  // Collect global grid state
  const globalGrid = {};
  gridCache.forEach((value, key) => {
    if (key.startsWith("global:")) {
      const tileId = key.substring(7); // Remove 'global:' prefix
      globalGrid[tileId] = value;
    } else if (!key.includes(":")) {
      // Legacy compatibility for tiles captured before room support
      globalGrid[key] = value;
    }
  });

  // Collect global online users
  const globalUsers = Array.from(activeUsers.entries())
    .filter(([_, u]) => u.roomId === "global")
    .map(([id, u]) => ({ id, username: u.username, color: u.color }));

  // Send initial state for global room
  socket.emit("init:state", {
    user: { id: socket.id, username, color },
    grid: globalGrid,
    onlineUsers: globalUsers,
    chatHistory: chatHistory.get("global") || []
  });

  // Notify everyone in global room
  socket.to("global").emit("user:joined", {
    id: socket.id,
    username,
    color
  });

  // Handle Room Join event
  socket.on("room:join", (data) => {
    if (!data) return;
    const { roomId, username: newName, color: newColor } = data;
    const profile = activeUsers.get(socket.id);
    if (!profile) return;

    const oldRoom = profile.roomId || "global";
    if (oldRoom === roomId) {
      // If name or color changes, propagate update in room
      if (newName) profile.username = newName.trim().substring(0, 16);
      if (newColor) profile.color = newColor;
      activeUsers.set(socket.id, profile);
      io.to(roomId).emit("user:updated", {
        id: socket.id,
        username: profile.username,
        color: profile.color
      });
      return;
    }

    // Leave old room
    socket.leave(oldRoom);
    io.to(oldRoom).emit("user:left", {
      id: socket.id,
      username: profile.username
    });

    // Join new room
    socket.join(roomId);
    profile.roomId = roomId;
    if (newName) profile.username = newName.trim().substring(0, 16);
    if (newColor) profile.color = newColor;
    
    activeUsers.set(socket.id, profile);

    // Fetch grid tiles for new room
    const roomGrid = {};
    gridCache.forEach((value, key) => {
      if (key.startsWith(roomId + ":")) {
        const tileId = key.substring(roomId.length + 1);
        roomGrid[tileId] = value;
      } else if (roomId === "global" && !key.includes(":")) {
        // Fallback legacy support for global
        roomGrid[key] = value;
      }
    });

    // Fetch active users in new room
    const roomUsers = Array.from(activeUsers.entries())
      .filter(([_, u]) => u.roomId === roomId)
      .map(([id, u]) => ({ id, username: u.username, color: u.color }));

    // Initialize room for this client
    socket.emit("init:room", {
      grid: roomGrid,
      onlineUsers: roomUsers,
      roomId,
      chatHistory: chatHistory.get(roomId) || []
    });

    // Notify other members in new room
    socket.to(roomId).emit("user:joined", {
      id: socket.id,
      username: profile.username,
      color: profile.color
    });
  });

  // Handle User updates (change name or color)
  socket.on("user:update", (data) => {
    if (!data) return;
    const { username: newName, color: newColor } = data;
    const profile = activeUsers.get(socket.id);
    if (profile) {
      let updatedName = profile.username;
      if (newName) {
        const trimmedName = newName.trim().substring(0, 16);
        if (trimmedName.toLowerCase() !== profile.username.toLowerCase()) {
          // Check if this username is already taken by another active user
          const isNameTaken = Array.from(activeUsers.entries()).some(([id, u]) => {
            return id !== socket.id && u.username.toLowerCase() === trimmedName.toLowerCase();
          });
          if (isNameTaken) {
            socket.emit("profile:rejected", { reason: "name_taken", username: trimmedName });
            return;
          }
        }
        updatedName = trimmedName;
      }

      let updatedColor = profile.color;
      if (newColor && newColor.toLowerCase() !== profile.color.toLowerCase()) {
        // Check if this color is already taken by another user
        const isColorTaken = Array.from(activeUsers.entries()).some(([id, u]) => {
          return id !== socket.id && u.color.toLowerCase() === newColor.toLowerCase();
        });
        if (isColorTaken) {
          socket.emit("color:rejected", { reason: "taken", color: newColor });
          return;
        }

        const oldColor = profile.color;
        updatedColor = newColor;

        // Update all pre-occupied blocks owned by this username to the new color
        db.run(
          `UPDATE tiles SET ownerColor = ? WHERE ownerName = ?`,
          [updatedColor, profile.username],
          (err) => {
            if (err) {
              console.error("Failed to update tile colors in DB:", err.message);
            }
          }
        );

        // Update memory cache and broadcast to all rooms
        gridCache.forEach((value, key) => {
          if (value.ownerName.toLowerCase() === profile.username.toLowerCase()) {
            value.ownerColor = updatedColor;

            // Parse Namespaced ID
            const parts = key.split(":");
            const roomId = parts[0];
            const tileId = parts[1] || parts[0];

            io.to(roomId).emit("tile:updated", {
              tileId,
              ...value
            });
          }
        });
      }

      profile.username = updatedName;
      profile.color = updatedColor;
      activeUsers.set(socket.id, profile);
      
      // Broadcast updated profile to the current room
      io.to(profile.roomId).emit("user:updated", {
        id: socket.id,
        username: profile.username,
        color: profile.color
      });
    }
  });

  // Handle Tile Capture requests
  socket.on("tile:capture", (data) => {
    if (!data || typeof data.tileId !== "string") return;
    const { tileId } = data;
    const profile = activeUsers.get(socket.id);
    if (!profile) return;
    const roomId = profile.roomId || "global";

    const now = Date.now();
    
    // Check if rapid mode (roomId contains "rapid")
    const isRapid = roomId.toLowerCase().includes("rapid");
    const COOLDOWN_MS = isRapid ? 500 : 5000; // 0.5s for rapid fire, 5s for others

    // Cooldown Validation
    const elapsed = now - profile.lastCaptureTime;
    if (elapsed < COOLDOWN_MS) {
      socket.emit("capture:rejected", {
        reason: "cooldown",
        timeLeft: Math.max(0.1, Math.ceil((COOLDOWN_MS - elapsed) / 100) / 10),
        tileId
      });
      return;
    }

    // Capture coordinates parsing
    const coordParts = tileId.split("-");
    if (coordParts.length !== 2) return;
    const x = parseInt(coordParts[0]);
    const y = parseInt(coordParts[1]);
    
    // Grid limits validation (30x30 board max)
    if (isNaN(x) || isNaN(y) || x < 0 || x >= 30 || y < 0 || y >= 30) {
      socket.emit("capture:rejected", { reason: "out-of-bounds", tileId });
      return;
    }

    profile.lastCaptureTime = now;
    activeUsers.set(socket.id, profile);

    // Save to Database with namespaced room prefix
    const namespacedId = `${roomId}:${tileId}`;

    db.run(
      `INSERT INTO tiles (id, ownerName, ownerColor, capturedAt) 
       VALUES (?, ?, ?, ?) 
       ON CONFLICT(id) DO UPDATE SET 
         ownerName=excluded.ownerName, 
         ownerColor=excluded.ownerColor, 
         capturedAt=excluded.capturedAt`,
      [namespacedId, profile.username, profile.color, now],
      (err) => {
        if (err) {
          console.error("DB Save Error:", err.message);
          socket.emit("capture:rejected", { reason: "database-error", tileId });
          return;
        }

        // Update in cache
        const tileState = {
          ownerName: profile.username,
          ownerColor: profile.color,
          capturedAt: now
        };
        gridCache.set(namespacedId, tileState);

        // Broadcast updated tile status to the room
        io.to(roomId).emit("tile:updated", {
          tileId,
          ...tileState
        });

        // Broadcast activity feed log event to the room
        io.to(roomId).emit("activity:log", {
          username: profile.username,
          color: profile.color,
          message: `captured cell (${x}, ${y})`,
          timestamp: now
        });
      }
    );
  });

  // Handle Chat messages
  socket.on("chat:send", (data) => {
    if (!data) return;
    const { message } = data;
    const profile = activeUsers.get(socket.id);
    if (!profile || !message || !message.trim()) return;
    const roomId = profile.roomId || "global";
    const chatMsg = {
      username: profile.username,
      color: profile.color,
      message: message.trim().substring(0, 150),
      timestamp: Date.now()
    };
    
    if (!chatHistory.has(roomId)) {
      chatHistory.set(roomId, []);
    }
    const history = chatHistory.get(roomId);
    history.push(chatMsg);
    if (history.length > 50) history.shift();
    
    io.to(roomId).emit("chat:receive", chatMsg);
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    const profile = activeUsers.get(socket.id);
    if (profile) {
      console.log(`Socket disconnected: ${socket.id} (${profile.username})`);
      activeUsers.delete(socket.id);
      
      // Notify other clients in the same room
      io.to(profile.roomId).emit("user:left", {
        id: socket.id,
        username: profile.username
      });
    }
  });
});

// Start HTTP and WebSocket server
httpServer.listen(PORT, () => {
  console.log(`Pixel grid backend running on http://localhost:${PORT}`);
});
