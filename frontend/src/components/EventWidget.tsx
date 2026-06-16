"use client";

import React, { useState } from "react";
import { Users, Copy, Check, LogOut, ShieldAlert, Plus, ChevronDown } from "lucide-react";

interface EventWidgetProps {
  currentRoom: string;
  onlineUsersCount: number;
  onJoinRoom: (roomId: string, mode?: string) => void;
  onLeaveRoom: () => void;
  onlineUsersList: Array<{ id: string; username: string; color: string }>;
}

export default function EventWidget({
  currentRoom,
  onlineUsersCount,
  onJoinRoom,
  onLeaveRoom,
  onlineUsersList
}: EventWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [roomInput, setRoomInput] = useState("");
  const [selectedMode, setSelectedMode] = useState("classic");
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = () => {
    // Generate a secure 6-letter room code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Add mode prefix to room code to handle modes natively
    const formattedCode = `${selectedMode}-${code}`;
    onJoinRoom(formattedCode, selectedMode);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    const cleanInput = roomInput.trim().toUpperCase();
    
    // Infer mode from prefix if any
    let mode = "classic";
    if (cleanInput.startsWith("RAPID-")) mode = "rapid";
    else if (cleanInput.startsWith("DUO-")) mode = "duo";
    else if (cleanInput.startsWith("SQUAD-")) mode = "squad";

    onJoinRoom(cleanInput, mode);
    setRoomInput("");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGlobal = currentRoom === "global";

  // Parse mode and display name for active room
  const getRoomDetails = () => {
    if (isGlobal) return { name: "Global Sandbox", mode: "classic" };
    const parts = currentRoom.split("-");
    const mode = parts[0].toLowerCase();
    const code = parts[1] || parts[0];
    
    let modeName = "Classic";
    if (mode === "rapid") modeName = "Rapid Fire";
    if (mode === "duo") modeName = "Duo Team Battle";
    if (mode === "squad") modeName = "Squad Wars";

    return { name: `Event: ${code}`, mode, modeName };
  };

  const roomDetails = getRoomDetails();

  return (
    <div className="neumorphic-raised p-6 space-y-4">
      {/* Clickable Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
            Organize An Event
          </h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${!isCollapsed ? "rotate-180" : ""}`} />
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-outline/35 space-y-4">
          {isGlobal ? (
            /* Create or Join Form */
            <div className="space-y-4">
              <p className="text-[10px] leading-relaxed text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                Create a custom room to play with friends (Up to 10 players)
              </p>

              {/* Mode Selector for creating room */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Select Game Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "classic", label: "Classic 5s" },
                    { id: "rapid", label: "Rapid 0.5s" },
                    { id: "duo", label: "Duo Red vs Blue" },
                    { id: "squad", label: "Squad 4-Color" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                        selectedMode === m.id
                          ? "bg-secondary text-white border-transparent shadow-md scale-102"
                          : "border-outline text-primary cell-embossed"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full py-2.5 px-4 rounded-xl bg-secondary text-white text-xs font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Custom Event
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-outline"></div>
                <span className="flex-shrink mx-3 text-[9px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase">OR JOIN ROOM</span>
                <div className="flex-grow border-t border-outline"></div>
              </div>

              {/* Join Form */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER ROOM CODE"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  className="px-3 py-2 rounded-xl text-[11px] font-mono font-black tracking-widest text-primary w-full focus:outline-none placeholder-slate-400 dark:placeholder-zinc-600 border border-outline bg-transparent neumorphic-item-pressed uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-102 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm border border-outline/10"
                >
                  Join
                </button>
              </form>
            </div>
          ) : (
            /* Active Private Room Layout */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    ACTIVE EVENT
                  </span>
                  <span className="text-sm font-black text-primary truncate mt-0.5">
                    {roomDetails.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase mt-0.5">
                    Mode: {roomDetails.modeName}
                  </span>
                </div>
                
                {/* Copy Button */}
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl border border-outline hover:border-secondary hover:scale-105 active:scale-90 transition-all cursor-pointer neumorphic-button bg-surface/50 text-slate-400 hover:text-secondary shrink-0"
                  title="Copy Room Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Players in Room */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400 dark:text-zinc-500">
                  <span>ONLINE PLAYERS ({onlineUsersCount}/10)</span>
                </div>
                
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {onlineUsersList.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-1.5 rounded-xl border border-outline/35 bg-surface/30">
                      <div
                        style={{ backgroundColor: user.color }}
                        className="w-4 h-4 rounded-md border border-black/5"
                      ></div>
                      <span className="text-[11px] font-black text-primary truncate">{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning Capacity */}
              {onlineUsersCount >= 10 && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500 dark:text-amber-400 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Room full! Max capacity is 10 active players.</span>
                </div>
              )}

              {/* Leave Button */}
              <button
                onClick={onLeaveRoom}
                className="w-full py-2 px-4 rounded-xl border border-outline hover:border-red-500/30 text-primary hover:text-red-500 bg-surface/50 text-xs font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer neumorphic-button"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Event Room
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
