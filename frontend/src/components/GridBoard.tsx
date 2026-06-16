"use client";

import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface GridBoardProps {
  grid: Record<string, { ownerName: string; ownerColor: string; capturedAt: number }>;
  onCapture: (tileId: string) => void;
  currentUserColor: string;
  cooldownActive: boolean;
}

interface GridCellProps {
  tileId: string;
  ownerName?: string;
  ownerColor?: string;
  capturedAt?: number;
  hasPulse: boolean;
  onClick: (tileId: string) => void;
}

// React.memo Optimized Cell Component to prevent 900x re-renders
const GridCell = React.memo(function GridCell({
  tileId,
  ownerName,
  ownerColor,
  capturedAt,
  hasPulse,
  onClick
}: GridCellProps) {
  const isCaptured = !!ownerName;
  const [r, c] = tileId.split("-");

  return (
    <div
      onClick={() => onClick(tileId)}
      style={{
        backgroundColor: isCaptured ? ownerColor : undefined,
        boxShadow: isCaptured
          ? `inset 1.5px 1.5px 3px rgba(0, 0, 0, 0.45), inset -1.5px -1.5px 3px rgba(255, 255, 255, 0.15)`
          : undefined,
      }}
      className={`w-[20px] h-[20px] rounded-[5px] cursor-pointer relative group/tile border ${
        isCaptured
          ? "cell-pressed animate-none"
          : "cell-embossed hover:scale-115 hover:z-10 hover:border-secondary/50"
      } ${hasPulse ? "animate-capture" : ""}`}
    >
      {/* Premium Instant Hover Tooltip */}
      <div className="absolute bottom-[135%] left-1/2 -translate-x-1/2 bg-slate-950/95 dark:bg-black/95 text-white text-[9px] font-mono font-black px-2.5 py-1.5 rounded-xl shadow-[4px_4px_10px_rgba(0,0,0,0.35)] pointer-events-none opacity-0 group-hover/tile:opacity-100 transition-opacity duration-75 whitespace-nowrap z-30 border border-white/10 flex flex-col gap-1 items-center">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isCaptured ? ownerColor : "#ccc" }} />
          <span>Cell ({r}, {c})</span>
        </div>
        {isCaptured ? (
          <span className="text-[8px] opacity-90">
            Owned by: <strong style={{ color: ownerColor }} className="font-extrabold">{ownerName}</strong>
          </span>
        ) : (
          <span className="text-[8px] opacity-65">Click to Claim</span>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if owner details, color, or pulse state changes
  return (
    prev.ownerName === next.ownerName &&
    prev.ownerColor === next.ownerColor &&
    prev.capturedAt === next.capturedAt &&
    prev.hasPulse === next.hasPulse
  );
});

export default function GridBoard({
  grid,
  onCapture,
  currentUserColor,
  cooldownActive,
}: GridBoardProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Synchronous tracking of drag movement to prevent blocking clicks
  const hasMovedRef = useRef(false);
  const mouseDownPos = useRef({ x: 0, y: 0 });

  // Track last updated tiles to trigger pulse animations
  const [pulseTiles, setPulseTiles] = useState<Record<string, boolean>>({});
  const prevGrid = useRef<typeof grid>({});

  // Detect new captures to trigger micro-animations
  useEffect(() => {
    const newPulseMap: Record<string, boolean> = {};
    let hasNew = false;
    
    Object.keys(grid).forEach((tileId) => {
      const current = grid[tileId];
      const prev = prevGrid.current[tileId];
      
      if (current && (!prev || prev.capturedAt !== current.capturedAt)) {
        newPulseMap[tileId] = true;
        hasNew = true;
      }
    });

    if (hasNew) {
      setPulseTiles((prev) => ({ ...prev, ...newPulseMap }));
      setTimeout(() => {
        setPulseTiles((prev) => {
          const updated = { ...prev };
          Object.keys(newPulseMap).forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
      }, 500);
    }
    
    prevGrid.current = grid;
  }, [grid]);

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    // If mouse moved more than 5px from starting click position, mark as drag
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx > 5 || dy > 5) {
      hasMovedRef.current = true;
    }
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    const touch = e.touches[0];
    mouseDownPos.current = { x: touch.clientX, y: touch.clientY };
    dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - mouseDownPos.current.x);
    const dy = Math.abs(touch.clientY - mouseDownPos.current.y);
    if (dx > 8 || dy > 8) {
      hasMovedRef.current = true;
    }
    setOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom helpers
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.75));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Handle tile click
  const handleTileClick = (tileId: string) => {
    if (hasMovedRef.current) return; // Block click if user was panning/dragging
    onCapture(tileId);
  };

  // Generate 30x30 cells list
  const rows = 30;
  const cols = 30;
  const cellIds: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cellIds.push(`${r}-${c}`);
    }
  }

  return (
    <div className="relative w-full h-full rounded-3xl bg-surface border border-outline neumorphic-pressed overflow-hidden select-none flex flex-col flex-1">
      {/* Background Dot Grid */}
      <div className="grid-bg"></div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 p-1.5 rounded-2xl border border-outline neumorphic-raised bg-surface/85 backdrop-blur-md">
        <button
          onClick={zoomIn}
          className="p-2 text-primary hover:text-secondary hover:scale-110 active:scale-90 transition-all rounded-lg cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 text-primary hover:text-secondary hover:scale-110 active:scale-90 transition-all rounded-lg cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-primary hover:text-secondary hover:scale-110 active:scale-90 transition-all rounded-lg cursor-pointer"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-surface/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-outline text-[10px] font-mono font-black text-primary shadow-sm">
        <Move className="w-3.5 h-3.5 text-secondary animate-pulse" />
        <span>DRAG TO PAN | CLICK TO CLAIM</span>
      </div>

      {/* Interactive Map/Grid Board Container */}
      <div
        ref={boardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full flex items-center justify-center cursor-grab ${
          isDragging ? "cursor-grabbing" : ""
        }`}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
            display: "grid",
            gridTemplateColumns: "repeat(30, minmax(0, 1fr))"
          }}
          className="transition-transform duration-75 ease-out gap-[3px] p-6 bg-transparent w-[720px] h-[720px] shrink-0"
        >
          {cellIds.map((tileId) => {
            const currentTile = grid[tileId];
            const hasPulse = !!pulseTiles[tileId];

            return (
              <GridCell
                key={tileId}
                tileId={tileId}
                ownerName={currentTile?.ownerName}
                ownerColor={currentTile?.ownerColor}
                capturedAt={currentTile?.capturedAt}
                hasPulse={hasPulse}
                onClick={handleTileClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
