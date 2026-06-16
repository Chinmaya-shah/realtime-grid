"use client";

import React, { useState, useEffect } from "react";
import { User, Sparkles, Check, Lock, Palette, HelpCircle, ArrowRight, Shield, RefreshCw, Eye, Move, X } from "lucide-react";

interface OnboardingModalProps {
  onlineUsers: Array<{ id: string; username: string; color: string }>;
  onComplete: (username: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  errorMessage?: string;
  clearError?: () => void;
  onClose?: () => void;
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

export default function OnboardingModal({
  onlineUsers,
  onComplete,
  initialName = "",
  initialColor = "",
  errorMessage = "",
  clearError,
  onClose
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: How to Play, Step 2: Profile Customize
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [customColor, setCustomColor] = useState("#ff4b2b");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Populate initial values once they are ready from socket or defaults
  useEffect(() => {
    if (initialName && !username) {
      setUsername(initialName);
    }
    if (initialColor && !selectedColor) {
      if (COLOR_OPTIONS.map(c => c.toLowerCase()).includes(initialColor.toLowerCase())) {
        setSelectedColor(initialColor);
      } else {
        setSelectedColor(initialColor);
        setCustomColor(initialColor);
        setShowCustomPicker(true);
      }
    }
  }, [initialName, initialColor]);

  // If no color selected yet, find the first available standard color
  useEffect(() => {
    if (!selectedColor && onlineUsers.length > 0) {
      const activeColors = new Set(onlineUsers.map(u => u.color.toLowerCase()));
      const available = COLOR_OPTIONS.find(c => !activeColors.has(c.toLowerCase()));
      if (available) {
        setSelectedColor(available);
      } else {
        setSelectedColor("#ff5555");
      }
    }
  }, [onlineUsers, selectedColor]);

  const activeColors = new Set(
    onlineUsers.map((u) => u.color.toLowerCase())
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setValidationError("");
    if (clearError) clearError();
  };

  const handleSelectColor = (color: string) => {
    if (activeColors.has(color.toLowerCase())) {
      setValidationError("This color is already taken by another active player.");
      return;
    }
    setSelectedColor(color);
    setValidationError("");
    if (clearError) clearError();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setSelectedColor(color);
    setValidationError("");
    if (clearError) clearError();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = username.trim();
    if (!trimmedName) {
      setValidationError("Please enter a nickname.");
      return;
    }

    if (trimmedName.length > 16) {
      setValidationError("Nickname must be 16 characters or less.");
      return;
    }

    if (!selectedColor) {
      setValidationError("Please select a grid color.");
      return;
    }

    if (activeColors.has(selectedColor.toLowerCase())) {
      setValidationError("This color is already taken by another active player.");
      return;
    }

    onComplete(trimmedName, selectedColor);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 select-none">
      <div className="shadow-2xl p-8 max-w-lg w-full mx-4 space-y-6 bg-surface border border-outline/10 text-foreground rounded-3xl animate-in fade-in zoom-in-95 duration-250 flex flex-col max-h-[90vh] overflow-y-auto relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl border border-outline/35 text-slate-400 hover:text-primary transition-all cursor-pointer bg-surface/50 hover:scale-105 active:scale-95 z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-1.5 shrink-0">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-secondary" : "w-2 bg-slate-350 dark:bg-zinc-700"}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-secondary" : "w-2 bg-slate-350 dark:bg-zinc-700"}`} />
        </div>

        {/* STEP 1: HOW TO PLAY */}
        {step === 1 && (
          <div className="space-y-6 flex flex-col flex-1 animate-in slide-in-from-left-5 duration-200">
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-secondary items-center justify-center text-white shadow-md shadow-secondary/20 mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight font-display mt-2">
                How to Play Pixel Board
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Learn the rules and claim your territory
              </p>
            </div>

            {/* Instruction cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Rule 1 */}
              <div className="p-4 rounded-2xl border border-outline/10 bg-surface/35 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 text-secondary">
                  <Palette className="w-4 h-4" />
                  <h4 className="text-[11px] font-mono font-black uppercase">1. Claim Territory</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 font-bold flex-1">
                  Click any neutral cell on the shared grid board to claim it. Your chosen color paints the tile immediately for all online users in real-time.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-2xl border border-outline/10 bg-surface/35 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 text-secondary">
                  <Shield className="w-4 h-4" />
                  <h4 className="text-[11px] font-mono font-black uppercase">2. Mind the Cooldown</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 font-bold flex-1">
                  Claiming a tile locks you in a cooldown (5s in Classic, 0.5s in Rapid). The cooldown progress bar displays your lockout recovery countdown.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-2xl border border-outline/10 bg-surface/35 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 text-secondary">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <h4 className="text-[11px] font-mono font-black uppercase">3. Choose Lobbies</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 font-bold flex-1">
                  Click any option in the **Game Modes Arena** card to jump lobbies. Lobbies support distinct rules (Rapid Fire click speeds, Team Red vs Blue, and 4-Faction Squad battles).
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-4 rounded-2xl border border-outline/10 bg-surface/35 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 text-secondary">
                  <Move className="w-4 h-4" />
                  <h4 className="text-[11px] font-mono font-black uppercase">4. Drag & Zoom Map</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400 font-bold flex-1">
                  The board is a 30x30 pixel grid. Hold and drag to pan across the board, and use the zoom controls to adjust your board layout view.
                </p>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-4 rounded-2xl bg-secondary text-white text-xs font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer neumorphic-orange-raised border border-white/10 shrink-0"
            >
              <span>Next: Customize Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PROFILE SETUP */}
        {step === 2 && (
          <div className="space-y-6 flex flex-col flex-1 animate-in slide-in-from-right-5 duration-200">
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-secondary items-center justify-center text-white shadow-md shadow-secondary/20 mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight font-display mt-2">
                Choose Nickname & Color
              </h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                This identity distinguishes your pixels on the grid
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nickname input */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  Choose your Nickname
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-slate-400 dark:text-zinc-605" />
                  <input
                    type="text"
                    placeholder="NICKNAME"
                    value={username}
                    onChange={handleUsernameChange}
                    maxLength={16}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-black text-primary placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none neumorphic-item-pressed border border-outline/35 bg-transparent uppercase"
                  />
                </div>
              </div>

              {/* Color palette */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                    Choose your Board Color
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomPicker(!showCustomPicker);
                      setSelectedColor(customColor);
                    }}
                    className={`text-[9px] font-mono font-black uppercase px-2 py-1 rounded-lg border border-outline flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      showCustomPicker ? "bg-secondary text-white border-transparent" : "text-primary bg-surface/50"
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    <span>Custom Color</span>
                  </button>
                </div>

                {/* Default Color Palette Grid */}
                <div className="grid grid-cols-5 gap-2.5 py-1">
                  {COLOR_OPTIONS.map((c) => {
                    const isTaken = activeColors.has(c.toLowerCase());
                    const isSelected = !showCustomPicker && selectedColor.toLowerCase() === c.toLowerCase();

                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={isTaken}
                        onClick={() => {
                          setShowCustomPicker(false);
                          handleSelectColor(c);
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-full aspect-square rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border relative shadow-sm hover:scale-110 active:scale-90 ${
                          isSelected
                            ? "ring-2 ring-secondary scale-105 border-transparent"
                            : "border-outline cell-embossed"
                        } ${isTaken ? "opacity-35 cursor-not-allowed scale-95" : ""}`}
                        title={isTaken ? "Already selected by another player" : c}
                      >
                        {isSelected && <Check className="w-3.5 text-white stroke-[3px]" />}
                        {isTaken && <Lock className="w-3 text-black stroke-[2.5px]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Picker input box */}
                {showCustomPicker && (
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-outline/35 neumorphic-item bg-surface/30 justify-center animate-in slide-in-from-top-2 duration-200">
                    <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-outline">
                      <input
                        type="color"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        className="absolute inset-0 w-full h-full cursor-pointer p-0 border-0 scale-150"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-mono font-black text-primary uppercase leading-tight">
                        Custom Color Picker
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        Selected: {selectedColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Validation & Server Error logs */}
              {(validationError || errorMessage) && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase text-center leading-relaxed">
                  {validationError || errorMessage}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 px-4 rounded-2xl border border-outline text-primary text-xs font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer neumorphic-button"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 px-4 rounded-2xl bg-secondary text-white text-xs font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer neumorphic-orange-raised border border-white/10"
                >
                  Start Playing
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
