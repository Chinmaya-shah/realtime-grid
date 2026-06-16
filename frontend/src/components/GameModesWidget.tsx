"use client";

import React, { useState } from "react";
import { Gamepad2, Swords, UserPlus, Flame, ChevronDown } from "lucide-react";

interface GameModesWidgetProps {
  activeMode: string;
}

export default function GameModesWidget({ activeMode }: GameModesWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const modes = [
    {
      id: "classic",
      name: "Classic Mode",
      desc: "Standard 5s capture cooldown. Dominate the grid through strategic claims.",
      icon: Gamepad2,
      color: "text-blue-500 bg-blue-500/10"
    },
    {
      id: "rapid",
      name: "Rapid Fire",
      desc: "Insane 0.5s cooldown! Capture cells at hyper speed. Ultra fast-paced.",
      icon: Flame,
      color: "text-amber-500 bg-amber-500/10"
    },
    {
      id: "duo",
      name: "Duo Battles",
      desc: "Players are locked to Team Red vs Team Blue. Highest team percentage wins.",
      icon: UserPlus,
      color: "text-rose-500 bg-rose-500/10"
    },
    {
      id: "squad",
      name: "Squad Wars",
      desc: "4-faction battle (Red, Blue, Green, Yellow). Clash for ultimate dominance.",
      icon: Swords,
      color: "text-purple-500 bg-purple-500/10"
    }
  ];

  return (
    <div className="neumorphic-raised p-6 space-y-4">
      {/* Clickable Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
            Game Modes Arena
          </h3>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${!isCollapsed ? "rotate-180" : ""}`} />
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-outline/35 space-y-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;

            return (
              <div
                key={m.id}
                className={`p-3 rounded-2xl border transition-all duration-300 flex gap-3 items-start ${
                  isActive
                    ? "border-secondary/40 bg-secondary/[0.03] scale-102 shadow-sm"
                    : "border-outline bg-surface/30 opacity-75 hover:opacity-100"
                }`}
              >
                {/* Icon badge */}
                <div className={`p-2 rounded-xl shrink-0 ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Detail */}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-primary uppercase">{m.name}</span>
                    {isActive && (
                      <span className="text-[8px] font-mono font-black bg-secondary text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[9.5px] leading-relaxed text-slate-400 dark:text-zinc-500 font-bold">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
