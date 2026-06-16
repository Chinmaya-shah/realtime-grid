"use client";

import React, { useState } from "react";
import { User, Edit3, Check, Loader2, Settings, Sun, Moon, Volume2, VolumeX, LogOut, Palette, Lock } from "lucide-react";

interface ProfileWidgetProps {
  user: { id: string; username: string; color: string } | null;
  onUpdate: (profile: { username: string; color: string }) => void;
  cooldownActive: boolean;
  cooldownTimeLeft: number;
  
  // Settings Dropdown Props
  soundEnabled: boolean;
  onToggleSound: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  currentRoom: string;
  onLeaveRoom: () => void;
  
  // Color uniqueness check
  onlineUsers: Array<{ id: string; username: string; color: string }>;
}

const COLOR_OPTIONS = [
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

export default function ProfileWidget({
  user,
  onUpdate,
  cooldownActive,
  cooldownTimeLeft,
  soundEnabled,
  onToggleSound,
  darkMode,
  onToggleTheme,
  currentRoom,
  onLeaveRoom,
  onlineUsers
}: ProfileWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#ff4b2b");
  const [localError, setLocalError] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close settings dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="neumorphic-raised p-6 flex items-center justify-center py-12 bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        <span className="ml-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Connecting...</span>
      </div>
    );
  }

  // Active colors claimed by other users
  const activeColors = new Set(
    onlineUsers
      .filter((u) => u.id !== user.id)
      .map((u) => u.color.toLowerCase())
  );

  const handleStartEdit = () => {
    setTempName(user.username);
    setIsEditing(true);
    setLocalError("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    onUpdate({ username: tempName.trim(), color: user.color });
    setIsEditing(false);
  };

  const handleColorSelect = (color: string) => {
    if (activeColors.has(color.toLowerCase())) {
      setLocalError("Color is already claimed by another player.");
      return;
    }
    setLocalError("");
    onUpdate({ username: user.username, color });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (activeColors.has(color.toLowerCase())) {
      setLocalError("Color is already claimed by another player.");
      return;
    }
    setLocalError("");
    onUpdate({ username: user.username, color });
  };

  const isGlobal = currentRoom === "global";

  // Cooldown calculation
  const COOLDOWN_MAX = cooldownTimeLeft > 0.5 ? 5 : 0.5; // adjust max depending on mode
  const cooldownPercent = cooldownActive ? (cooldownTimeLeft / COOLDOWN_MAX) * 100 : 0;

  return (
    <div className="neumorphic-raised p-6 space-y-5 relative">
      {/* Brand Logo & User Settings Header */}
      <div className="flex items-center justify-between border-b border-outline/35 pb-3">
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center text-white shrink-0 shadow-sm neumorphic-orange-raised">
            <span className="text-xs font-black">PB</span>
          </div>
          <span className="text-xs font-black tracking-tight text-primary uppercase leading-none font-display">
            Pixel Board
          </span>
        </div>

        {/* User Settings Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="px-2.5 py-1.5 rounded-xl border border-outline text-[10px] font-black uppercase tracking-wider text-primary shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer neumorphic-button bg-surface/50"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Settings</span>
          </button>

          {/* Styled Floating Neumorphic Dropdown */}
          {settingsOpen && (
            <div className="absolute right-0 mt-2.5 w-48 rounded-2xl border border-outline neumorphic-item p-2 z-50 space-y-1 bg-surface shadow-lg">
              <button
                onClick={() => {
                  onToggleTheme();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-black uppercase text-primary hover:text-secondary rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-left cursor-pointer"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-500" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onToggleSound();
                  setSettingsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-black uppercase text-primary hover:text-secondary rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-left cursor-pointer"
              >
                {soundEnabled ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    <span>Mute Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                    <span>Enable Audio</span>
                  </>
                )}
              </button>

              {!isGlobal && (
                <button
                  onClick={() => {
                    onLeaveRoom();
                    setSettingsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[11px] font-black uppercase text-red-500 hover:text-red-650 rounded-xl hover:bg-red-500/5 transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Leave Room</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Name Info Row */}
      <div className="flex items-center justify-between gap-3">
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold w-full focus:outline-none text-primary neumorphic-pressed border border-outline bg-transparent"
              maxLength={16}
              autoFocus
            />
            <button
              type="submit"
              className="p-1.5 bg-secondary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-md"
              title="Save Name"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div
              style={{ backgroundColor: user.color }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-mono font-black text-sm shrink-0 border border-black/10 shadow-[2px_2px_5px_rgba(0,0,0,0.15)] led-cell"
            >
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            
            <div className="flex flex-col truncate">
              <span className="text-xs font-black text-primary truncate">
                {user.username}
              </span>
              <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wide">
                ID: {user.id.substring(0, 6)}...
              </span>
            </div>

            <button
              onClick={handleStartEdit}
              className="p-1.5 hover:text-secondary text-slate-400 dark:text-zinc-400 hover:scale-110 active:scale-90 transition-all cursor-pointer rounded-lg neumorphic-button border border-outline ml-auto bg-transparent"
              title="Edit Nickname"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Color Selection Palette */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Choose Board Color
          </span>
          
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-lg border border-outline flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              showCustomPicker ? "bg-secondary text-white border-transparent" : "text-primary bg-transparent"
            }`}
          >
            <Palette className="w-2.5 h-2.5" />
            <span>Custom</span>
          </button>
        </div>

        {/* Standard Palette Colors */}
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => {
            const isTaken = activeColors.has(c.toLowerCase());
            const isSelected = !showCustomPicker && user.color.toLowerCase() === c.toLowerCase();

            return (
              <button
                key={c}
                disabled={isTaken}
                onClick={() => {
                  setShowCustomPicker(false);
                  handleColorSelect(c);
                }}
                style={{ backgroundColor: c }}
                className={`w-5.5 h-5.5 rounded-lg transition-transform hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center border relative shadow-sm ${
                  isSelected ? "ring-2 ring-secondary scale-105 border-transparent" : "border-outline cell-embossed"
                } ${isTaken ? "opacity-30 cursor-not-allowed scale-95" : ""}`}
                title={isTaken ? "Taken by another player" : c}
              >
                {isSelected && <Check className="w-3 text-white stroke-[3px]" />}
                {isTaken && <Lock className="w-2.5 text-white/80 stroke-[2.5px]" />}
              </button>
            );
          })}
        </div>

        {/* Custom Color Input */}
        {showCustomPicker && (
          <div className="flex items-center gap-3 p-2 rounded-xl border border-outline/35 neumorphic-item bg-surface/30 justify-center animate-in slide-in-from-top-1 duration-150">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 border border-outline">
              <input
                type="color"
                value={user.color.startsWith("#") ? user.color : customColor}
                onChange={handleCustomColorChange}
                className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0 scale-150"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono font-black text-primary uppercase leading-tight">
                Pick Custom Color
              </span>
              <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase">
                {user.color.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {localError && (
          <span className="text-[8px] font-black text-red-500 uppercase tracking-wide block animate-pulse">
            {localError}
          </span>
        )}
      </div>

      {/* Cooldown Status card */}
      <div className="pt-3 border-t border-outline/35 space-y-2">
        <div className="flex justify-between items-center text-[9px] font-mono font-black">
          <span className="text-slate-400 dark:text-zinc-500 uppercase tracking-wider">CAPTURE COOLDOWN</span>
          <span className={cooldownActive ? "text-secondary font-black" : "text-emerald-500 font-black"}>
            {cooldownActive ? `${cooldownTimeLeft.toFixed(1)}s LOCKED` : "READY"}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full neumorphic-pressed overflow-hidden relative border border-outline/35 p-[1px]">
          <div
            style={{ width: `${cooldownPercent}%` }}
            className={`h-full transition-all duration-100 ease-linear rounded-full ${
              cooldownActive ? "bg-secondary shadow-[0_0_8px_rgba(255,75,43,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
