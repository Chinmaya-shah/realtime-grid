"use client";

import React, { useRef, useEffect } from "react";
import { Terminal, Clock } from "lucide-react";

export interface LogEvent {
  username: string;
  color: string;
  message: string;
  timestamp: number;
}

interface ActivityLogProps {
  logs: LogEvent[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="neumorphic-raised p-6 space-y-4">
      {/* Static Header */}
      <div className="flex items-center gap-2 border-b border-outline/35 pb-2">
        <Terminal className="w-5 h-5 text-secondary" />
        <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
          Activity Feed
        </h3>
      </div>

      {/* Permanently Visible Content */}
      <div className="space-y-4">
        {/* Sunken Dark Terminal Console */}
        <div
          ref={containerRef}
          className="space-y-2.5 h-[180px] overflow-y-auto font-mono text-[10px] leading-relaxed p-4 rounded-2xl neumorphic-item-pressed !bg-slate-950 dark:!bg-black text-slate-300 border border-outline/30"
        >
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-bold italic">
              &gt; Waiting for activity signals...
            </div>
          ) : (
            logs.map((log, idx) => {
              const timeString = new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              });

              return (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 border-b border-white/5 pb-1 last:border-0"
                >
                  <Clock className="w-3 h-3 text-slate-600 shrink-0 mt-[1.5px]" />
                  <span className="text-emerald-500 shrink-0 select-none font-bold">
                    [{timeString}]
                  </span>
                  <span className="flex-1 text-slate-300">
                    <strong style={{ color: log.color }} className="font-extrabold">
                      {log.username}
                    </strong>{" "}
                    <span className="font-medium text-slate-300">{log.message}</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
