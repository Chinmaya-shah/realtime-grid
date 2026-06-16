"use client";

import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Sparkles, BarChart3 } from "lucide-react";
import ProfileWidget from "@/components/ProfileWidget";
import Leaderboard from "@/components/Leaderboard";
import ActivityLog, { LogEvent } from "@/components/ActivityLog";
import GridBoard from "@/components/GridBoard";
import QuestsWidget, { Quest } from "@/components/QuestsWidget";
import EventWidget from "@/components/EventWidget";
import GameModesWidget from "@/components/GameModesWidget";
import { soundManager } from "@/components/SoundManager";
import ChatWidget, { ChatMessage } from "@/components/ChatWidget";
import OnboardingModal from "@/components/OnboardingModal";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

// Deterministic Team assignment based on nickname
const getDuoTeamColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 2 === 0 ? "#ff3300" : "#3366ff"; // Duo Crimson vs Royal Blue
};

const getSquadTeamColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#ff3300", "#3366ff", "#00ff66", "#ff9900"]; // Crimson, Royal Blue, Neon Green, Gold
  return colors[Math.abs(hash) % 4];
};

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; color: string } | null>(null);
  const [grid, setGrid] = useState<Record<string, { ownerName: string; ownerColor: string; capturedAt: number }>>({});
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; username: string; color: string }>>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  
  // Custom Rooms / Events states
  const [currentRoom, setCurrentRoom] = useState("global");
  const [gameMode, setGameMode] = useState("classic");

  // Cooldown states
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

  // Theme & Audio states
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState("");

  // Quests/Achievements state
  const [quests, setQuests] = useState<Quest[]>([
    { id: "first_conquest", title: "First Conquest", description: "Claim at least 1 cell on the board", target: 1, current: 0, completed: false },
    { id: "grid_dominator", title: "Grid Dominator", description: "Claim 10 cells total on the board", target: 10, current: 0, completed: false },
    { id: "corner_conqueror", title: "Corner Conqueror", description: "Claim any of the 4 board corners", target: 1, current: 0, completed: false },
    { id: "center_strike", title: "Center Strike", description: "Claim a cell in the center 4x4 area", target: 1, current: 0, completed: false },
    { id: "double_agent", title: "Double Agent", description: "Conquer a cell owned by another player", target: 1, current: 0, completed: false }
  ]);

  // Keep a ref of currentUser to prevent stale closures in socket callbacks
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Initialize Theme, Sounds, and Onboarding status on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const savedSound = localStorage.getItem("sound_effects");
    if (savedSound === "false") {
      setSoundEnabled(false);
      soundManager.setEnabled(false);
    } else {
      setSoundEnabled(true);
      soundManager.setEnabled(true);
    }

    const onboarded = localStorage.getItem("has_onboarded") === "true";
    setHasOnboarded(onboarded);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.setEnabled(nextVal);
    localStorage.setItem("sound_effects", nextVal ? "true" : "false");
  };

  // Enforce team-based colors in Duo/Squad mode
  useEffect(() => {
    if (!currentUser || !socket) return;
    
    let targetColor = currentUser.color;
    if (gameMode === "duo") {
      targetColor = getDuoTeamColor(currentUser.username);
    } else if (gameMode === "squad") {
      targetColor = getSquadTeamColor(currentUser.username);
    }

    if (targetColor !== currentUser.color) {
      setCurrentUser((prev) => prev ? { ...prev, color: targetColor } : null);
      socket.emit("user:update", { username: currentUser.username, color: targetColor });
    }
  }, [gameMode, currentUser?.username, socket]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    console.log("Connecting to WebSocket server:", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected.");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected.");
    });

    // Initialize full state on join
    newSocket.on("init:state", ({ user, grid: initialGrid, onlineUsers: initialUsers, chatHistory }) => {
      // Check localStorage for previously saved profile
      const savedName = localStorage.getItem("username");
      const savedColor = localStorage.getItem("color");
      const onboarded = localStorage.getItem("has_onboarded") === "true";
      
      let finalUser = user;
      if (onboarded && savedName && savedColor) {
        newSocket.emit("user:update", { username: savedName, color: savedColor });
        finalUser = { ...user, username: savedName, color: savedColor };
      }

      setCurrentUser(finalUser);
      setGrid(initialGrid);
      setOnlineUsers(initialUsers);
      setCurrentRoom("global");
      setGameMode("classic");
      if (chatHistory) setChatMessages(chatHistory);
      
      setLogs((prev) => [
        ...prev,
        {
          username: "System",
          color: "#475569",
          message: `connected to global sandbox database`,
          timestamp: Date.now()
        }
      ]);
    });

    // Handle color rejection
    newSocket.on("color:rejected", ({ reason, color }) => {
      if (reason === "taken") {
        setServerErrorMessage(`Color ${color.toUpperCase()} is already taken by another active player!`);
      }
    });

    // Initialize state on joining private room
    newSocket.on("init:room", ({ grid: roomGrid, onlineUsers: roomUsers, roomId, chatHistory }) => {
      setGrid(roomGrid);
      setOnlineUsers(roomUsers);
      setCurrentRoom(roomId);
      if (chatHistory) setChatMessages(chatHistory);
      
      // Infer mode from prefix
      let mode = "classic";
      if (roomId.startsWith("rapid-")) mode = "rapid";
      else if (roomId.startsWith("duo-")) mode = "duo";
      else if (roomId.startsWith("squad-")) mode = "squad";
      
      setGameMode(mode);
      
      setLogs((prev) => [
        ...prev,
        {
          username: "System",
          color: "#475569",
          message: `joined event room [${roomId}]`,
          timestamp: Date.now()
        }
      ]);
    });

    // Handle user join/leave/update signals
    newSocket.on("user:joined", (user) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
      setLogs((prev) => [
        ...prev,
        {
          username: user.username,
          color: user.color,
          message: "joined the board",
          timestamp: Date.now()
        }
      ]);
    });

    newSocket.on("user:left", ({ id, username }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== id));
      setLogs((prev) => [
        ...prev,
        {
          username: username,
          color: "#475569",
          message: "left the board",
          timestamp: Date.now()
        }
      ]);
    });

    newSocket.on("user:updated", (updatedUser) => {
      setOnlineUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      setCurrentUser((prev) => {
        if (prev && prev.id === updatedUser.id) {
          return { ...prev, username: updatedUser.username, color: updatedUser.color };
        }
        return prev;
      });
    });

    // Handle board updates and takeover sound triggers
    newSocket.on("tile:updated", ({ tileId, ownerName, ownerColor, capturedAt }) => {
      setGrid((prev) => {
        const prevTile = prev[tileId];
        const cUser = currentUserRef.current;
        
        // Trigger double agent quest if capturing another player's cell
        if (
          prevTile &&
          cUser &&
          prevTile.ownerName.toLowerCase() !== cUser.username.toLowerCase() &&
          ownerName.toLowerCase() === cUser.username.toLowerCase()
        ) {
          setQuests((prevQuests) => {
            let newlyCompleted = false;
            const updated = prevQuests.map((q) => {
              if (q.id === "double_agent" && !q.completed) {
                newlyCompleted = true;
                return { ...q, current: 1, completed: true };
              }
              return q;
            });
            if (newlyCompleted) {
              soundManager.playSuccess();
            }
            return updated;
          });
        }
        
        return {
          ...prev,
          [tileId]: { ownerName, ownerColor, capturedAt }
        };
      });
    });

    // Handle feed logs
    newSocket.on("activity:log", (log) => {
      setLogs((prev) => [...prev, log].slice(-100)); // Keep last 100 logs
    });

    // Handle Chat Messages
    newSocket.on("chat:receive", (msg) => {
      setChatMessages((prev) => [...prev, msg].slice(-100));
    });

    // Handle capture errors/cooldown rejections
    newSocket.on("capture:rejected", ({ reason, timeLeft }) => {
      if (reason === "cooldown" && timeLeft) {
        soundManager.playError();
        triggerCooldown(timeLeft);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Recalculate achievement progress based on current grid state
  useEffect(() => {
    if (!currentUser) return;
    
    // Count user owned cells
    const userOwned = Object.values(grid).filter(
      (tile) => tile.ownerName.toLowerCase() === currentUser.username.toLowerCase()
    );
    const count = userOwned.length;

    // Check corners
    const corners = ["0-0", "0-29", "29-0", "29-29"];
    const hasCorner = corners.some((coord) => {
      const tile = grid[coord];
      return tile && tile.ownerName.toLowerCase() === currentUser.username.toLowerCase();
    });

    // Check center 4x4
    let hasCenter = false;
    for (let r = 13; r <= 16; r++) {
      for (let c = 13; c <= 16; c++) {
        const tile = grid[`${r}-${c}`];
        if (tile && tile.ownerName.toLowerCase() === currentUser.username.toLowerCase()) {
          hasCenter = true;
          break;
        }
      }
      if (hasCenter) break;
    }

    setQuests((prevQuests) => {
      let newlyCompleted = false;
      const next = prevQuests.map((q) => {
        let current = q.current;
        let completed = q.completed;

        if (q.id === "first_conquest") {
          current = count >= 1 ? 1 : 0;
        } else if (q.id === "grid_dominator") {
          current = Math.min(count, 10);
        } else if (q.id === "corner_conqueror") {
          current = hasCorner ? 1 : 0;
        } else if (q.id === "center_strike") {
          current = hasCenter ? 1 : 0;
        }

        const nextCompleted = current >= q.target;
        if (nextCompleted && !completed) {
          completed = true;
          newlyCompleted = true;
        }
        return { ...q, current, completed };
      });

      if (newlyCompleted) {
        soundManager.playSuccess();
      }
      return next;
    });
  }, [grid, currentUser]);

  // Update user profile changes
  const handleUpdateProfile = (profile: { username: string; color: string }) => {
    if (socket) {
      // If team mode, override requested color with team color
      let finalColor = profile.color;
      if (gameMode === "duo") {
        finalColor = getDuoTeamColor(profile.username);
      } else if (gameMode === "squad") {
        finalColor = getSquadTeamColor(profile.username);
      }

      socket.emit("user:update", { username: profile.username, color: finalColor });
      
      // Save to localStorage
      localStorage.setItem("username", profile.username);
      localStorage.setItem("color", finalColor);
    }
  };

  const handleOnboardingComplete = (username: string, color: string) => {
    localStorage.setItem("username", username);
    localStorage.setItem("color", color);
    localStorage.setItem("has_onboarded", "true");
    setHasOnboarded(true);
    setServerErrorMessage("");
    
    if (socket) {
      socket.emit("user:update", { username, color });
    }
  };

  // Join private room namespace
  const handleJoinRoom = (roomId: string, mode: string = "classic") => {
    if (socket) {
      let resolvedColor = currentUser ? currentUser.color : "#ff4b2b";
      if (currentUser) {
        if (mode === "duo") resolvedColor = getDuoTeamColor(currentUser.username);
        else if (mode === "squad") resolvedColor = getSquadTeamColor(currentUser.username);
      }
      
      socket.emit("room:join", { roomId, color: resolvedColor });
    }
  };

  const handleSelectLobby = (modeId: string) => {
    if (modeId === "classic") {
      handleJoinRoom("global", "classic");
    } else {
      handleJoinRoom(`${modeId}-global`, modeId);
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit("room:join", { roomId: "global" });
    }
  };

  const handleSendMessage = (message: string) => {
    if (socket) {
      socket.emit("chat:send", { message });
    }
  };

  // Capture Tile
  const handleCaptureTile = (tileId: string) => {
    if (cooldownActive) {
      soundManager.playError();
      return;
    }
    if (socket) {
      soundManager.playCapture();
      socket.emit("tile:capture", { tileId });
    }
  };

  // Run Cooldown countdown
  const triggerCooldown = (seconds: number) => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    
    setCooldownActive(true);
    setCooldownTimeLeft(seconds);

    const step = 0.05; // faster step updates for smoother bar animations
    cooldownTimer.current = setInterval(() => {
      setCooldownTimeLeft((prev) => {
        if (prev <= step) {
          setCooldownActive(false);
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          soundManager.playReady();
          return 0;
        }
        return prev - step;
      });
    }, 50);
  };

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  // Compute stats
  const myClaimedCount = currentUser
    ? Object.values(grid).filter((tile) => tile.ownerName.toLowerCase() === currentUser.username.toLowerCase()).length
    : 0;
  const dominancePct = ((myClaimedCount / 900) * 100).toFixed(1);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-screen w-full bg-background text-foreground font-sans antialiased overflow-x-hidden lg:overflow-hidden">
      
      {/* 1. LEFT SIDEBAR - Scrollable independently on desktop */}
      <aside 
        data-lenis-prevent
        className="w-full lg:w-[340px] p-6 space-y-6 border-r border-outline shrink-0 flex flex-col select-none lg:h-screen lg:overflow-y-auto scrollbar-stable"
      >
        
        {/* User Nickname & stats dropdown in profile */}
        <ProfileWidget
          user={currentUser}
          onUpdate={handleUpdateProfile}
          cooldownActive={cooldownActive}
          cooldownTimeLeft={cooldownTimeLeft}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          currentRoom={currentRoom}
          onLeaveRoom={handleLeaveRoom}
          onShowHelp={() => setShowHelpModal(true)}
          onlineUsers={onlineUsers}
        />

        {/* 5. Activity log console - moved below user profile */}
        <ActivityLog logs={logs} />

        {/* stats widget - permanently expanded */}
        {currentUser && (
          <div className="neumorphic-raised p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-outline/35 pb-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                My Statistics
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="neumorphic-item-pressed p-3 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-550 uppercase">Pixels Owned</span>
                <span className="text-base font-black text-primary mt-1">{myClaimedCount}</span>
              </div>
              <div className="neumorphic-item-pressed p-3 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-550 uppercase">Board Domination</span>
                <span className="text-base font-black text-secondary mt-1">{dominancePct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Organize an Event */}
        <EventWidget
          currentRoom={currentRoom}
          onlineUsersCount={onlineUsers.length}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onlineUsersList={onlineUsers}
        />

        {/* 3. Quests & Achievements */}
        <QuestsWidget quests={quests} />

        {/* 4. Game Modes Selection Display */}
        <GameModesWidget activeMode={gameMode} onSelectMode={handleSelectLobby} />
      </aside>

      {/* 2. CENTER PLAYGROUND - Fixed viewport on desktop */}
      <main className="flex-1 min-w-0 h-[600px] lg:h-screen flex flex-col p-4 overflow-hidden bg-surface/35 relative items-center justify-center">
        <GridBoard
          grid={grid}
          onCapture={handleCaptureTile}
          currentUserColor={currentUser ? currentUser.color : "#ff4b2b"}
          cooldownActive={cooldownActive}
        />
      </main>

      {/* 3. RIGHT SIDEBAR - Fixed height viewport with chat and leaderboard on desktop */}
      <aside 
        data-lenis-prevent
        className="w-full lg:w-[340px] p-6 space-y-6 border-l border-outline shrink-0 flex flex-col select-none lg:h-screen lg:overflow-hidden bg-surface/5"
      >
        <Leaderboard
          grid={grid}
          onlineUsers={onlineUsers}
        />
        <ChatWidget
          currentRoom={currentRoom}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      </aside>

      {(!hasOnboarded || showHelpModal) && (
        <OnboardingModal
          onlineUsers={onlineUsers}
          onComplete={(username, color) => {
            handleOnboardingComplete(username, color);
            setShowHelpModal(false);
          }}
          initialName={currentUser?.username}
          initialColor={currentUser?.color}
          errorMessage={serverErrorMessage}
          clearError={() => setServerErrorMessage("")}
          onClose={showHelpModal ? () => setShowHelpModal(false) : undefined}
        />
      )}

    </div>
  );
}
