"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";

export interface ChatMessage {
  username: string;
  color: string;
  message: string;
  timestamp: number;
}

interface ChatWidgetProps {
  currentRoom: string;
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
}

export default function ChatWidget({ currentRoom, messages, onSendMessage }: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const isGlobal = currentRoom === "global";
  const displayRoomName = isGlobal
    ? "Global Chat"
    : `Event Chat: ${currentRoom.split("-")[1] || currentRoom}`;

  return (
    <div className="neumorphic-raised p-6 flex flex-col flex-grow min-h-[300px] lg:min-h-[42%] overflow-hidden relative">
      {/* Clickable Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-outline/35 shrink-0 select-none">
        <MessageSquare className="w-5 h-5 text-secondary animate-pulse" />
        <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
          {displayRoomName}
        </h3>
      </div>

      {/* Messages List Viewport */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-4 text-xs font-bold leading-normal">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-zinc-600 font-mono italic text-[11px] select-none">
            &gt; No messages in this room yet. Say hello!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={idx}
                className="flex flex-col p-2 rounded-xl border border-outline/10 bg-surface/35 hover:bg-surface/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 select-none mb-0.5">
                  <span
                    style={{ color: msg.color }}
                    className="font-extrabold tracking-tight truncate max-w-[140px]"
                  >
                    {msg.username}
                  </span>
                  <span className="text-[9px] font-mono font-normal text-slate-400 dark:text-zinc-500 shrink-0">
                    {timeString}
                  </span>
                </div>
                <p className="text-primary break-words whitespace-pre-wrap font-medium">
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Form Input Field */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2 shrink-0 select-none">
        <input
          type="text"
          maxLength={150}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow py-2.5 px-3.5 rounded-xl text-xs font-bold bg-surface border border-outline/40 text-primary neumorphic-item-pressed outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-secondary transition-all"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-secondary text-white hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
