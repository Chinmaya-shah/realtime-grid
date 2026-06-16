"use client";

import React from "react";
import { CheckCircle2, Circle, Trophy } from "lucide-react";

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

interface QuestsWidgetProps {
  quests: Quest[];
}

export default function QuestsWidget({ quests }: QuestsWidgetProps) {
  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="neumorphic-raised p-6 space-y-4">
      {/* Static Header */}
      <div className="flex items-center justify-between border-b border-outline/35 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
            Grid Missions
          </h3>
        </div>
        <div>
          <span className="text-[10px] font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {completedCount}/{totalCount} DONE
          </span>
        </div>
      </div>

      {/* Permanently Visible Content */}
      <div className="space-y-4">
        {/* Overview Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400 dark:text-zinc-500">
            <span>MISSIONS PATHWAY</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative border border-outline/30">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
            ></div>
          </div>
        </div>

        {/* Quest items list */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-2">
          {quests.map((quest) => {
            const ratio = Math.min(quest.current / quest.target, 1);
            const itemPercent = ratio * 100;

            return (
              <div
                key={quest.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  quest.completed
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-surface border-outline hover:border-secondary hover:-translate-y-0.5 hover:shadow-sm"
                }`}
              >
                {/* Highlight flash background for completed ones */}
                {quest.completed && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none -mr-4 -mt-4"></div>
                )}

                <div className="flex gap-3 relative z-10">
                  {/* Left side checkbox / icon */}
                  <div className="shrink-0 mt-0.5">
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={`text-xs font-black leading-none ${
                          quest.completed ? "text-emerald-700 dark:text-emerald-400 line-through opacity-85" : "text-primary"
                        }`}
                      >
                        {quest.title}
                      </span>
                      <span className="text-[9px] font-mono font-black text-slate-400 dark:text-zinc-500 shrink-0">
                        {quest.current}/{quest.target}
                      </span>
                    </div>

                    <p className="text-[10px] leading-snug text-slate-400 dark:text-zinc-500 font-bold">
                      {quest.description}
                    </p>

                    {/* Micro Progress Bar */}
                    {!quest.completed && (
                      <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-zinc-905 overflow-hidden relative">
                        <div
                          style={{ width: `${itemPercent}%` }}
                          className="h-full bg-secondary transition-all duration-300 rounded-full"
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
