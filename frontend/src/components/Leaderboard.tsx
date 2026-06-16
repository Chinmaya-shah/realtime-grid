"use client";

import React from "react";
import { Trophy, Users } from "lucide-react";

interface LeaderboardProps {
  grid: Record<string, { ownerName: string; ownerColor: string; capturedAt: number }>;
  onlineUsers: Array<{ id: string; username: string; color: string }>;
}

export default function Leaderboard({ grid, onlineUsers }: LeaderboardProps) {
  // Calculate ownership counts
  const ownerStats: Record<string, { name: string; color: string; count: number }> = {};
  
  // Count tiles per owner
  Object.values(grid).forEach((tile) => {
    if (!tile.ownerName) return;
    if (!ownerStats[tile.ownerName]) {
      ownerStats[tile.ownerName] = {
        name: tile.ownerName,
        color: tile.ownerColor,
        count: 0
      };
    }
    ownerStats[tile.ownerName].count += 1;
  });

  // Sort owners by count descending
  const sortedLeaders = Object.values(ownerStats).sort((a, b) => b.count - a.count);
  const totalCaptured = Object.keys(grid).length;
  const totalPossible = 900; // 30x30

  return (
    <div className="neumorphic-raised p-6 flex flex-col flex-grow min-h-[250px] lg:min-h-[42%] overflow-hidden relative">
      {/* Fixed Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline/35 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary animate-bounce" />
          <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
            Leaderboard
          </h3>
        </div>
        <span className="text-[10px] font-mono font-black bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-secondary/20 shadow-sm">
          {totalCaptured}/{totalPossible} CLAIMED
        </span>
      </div>

      {/* Leaderboard List - Flex Grow & Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 mt-4 text-xs font-bold leading-normal space-y-1">
        {sortedLeaders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-zinc-600 font-mono italic text-[11px] select-none">
            &gt; No cells claimed yet. Tap the board to conquer!
          </div>
        ) : (
          sortedLeaders.map((leader, idx) => {
            const percentage = ((leader.count / totalPossible) * 100).toFixed(1);
            
            // Compact Rank display
            const renderRank = () => {
              if (idx === 0) return <span className="text-amber-500 font-black">🏆</span>;
              if (idx === 1) return <span className="text-slate-400 font-black">🥈</span>;
              if (idx === 2) return <span className="text-amber-700 dark:text-amber-600 font-black">🥉</span>;
              return <span className="text-[10px] font-mono font-black text-slate-400 dark:text-zinc-500">#{idx + 1}</span>;
            };

            const isOnline = onlineUsers.some(
              (u) => u.username.toLowerCase() === leader.name.toLowerCase()
            );

            return (
              <div
                key={idx}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl border border-outline/5 hover:bg-surface/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-5 flex items-center justify-center shrink-0">
                    {renderRank()}
                  </div>

                  {/* Colored dot */}
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/5" 
                    style={{ backgroundColor: leader.color }}
                  />

                  {/* Player Name */}
                  <span className="text-xs font-black text-primary truncate flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{leader.name}</span>
                    {isOnline && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online"></span>
                    )}
                  </span>
                </div>

                {/* Domination details */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold">
                    {leader.count} {leader.count === 1 ? "cell" : "cells"}
                  </span>
                  <span className="text-[10px] font-mono font-black bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-primary">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Online Users Count Footer */}
      <div className="pt-3 mt-3 border-t border-outline flex items-center justify-between text-[10px] font-mono font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 select-none">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-secondary" />
          <span>Active Players:</span>
        </span>
        <span className="text-primary font-black">{onlineUsers.length} online</span>
      </div>
    </div>
  );
}
