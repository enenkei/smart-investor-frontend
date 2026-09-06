"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogLevelFilterBadgesProps {
  level: string;
  onSelectLevel: (level: string) => void;
  counts: Record<string, number>;
  total: number;
  className?: string;
}

export function LogLevelFilterBadges({
  level,
  onSelectLevel,
  counts,
  total,
  className,
}: LogLevelFilterBadgesProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        onClick={() => onSelectLevel("ALL")}
        className={cn(
          "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
          level === "ALL"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-card/40 border-border/60 hover:bg-muted text-muted-foreground"
        )}
      >
        <span>All</span>
        <span className="text-[10px] opacity-80 font-mono">
          ({counts.TOTAL ?? total})
        </span>
      </button>

      {counts.ERROR != null && (
        <button
          onClick={() => onSelectLevel("ERROR")}
          className={cn(
            "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
            level === "ERROR"
              ? "bg-rose-500 text-white border-rose-500 shadow-sm"
              : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 text-rose-500"
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Errors</span>
          <span className="text-[10px] font-mono">({counts.ERROR})</span>
        </button>
      )}

      {counts.WARNING != null && (
        <button
          onClick={() => onSelectLevel("WARNING")}
          className={cn(
            "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
            level === "WARNING"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 text-amber-500"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Warnings</span>
          <span className="text-[10px] font-mono">({counts.WARNING})</span>
        </button>
      )}

      {counts.INFO != null && (
        <button
          onClick={() => onSelectLevel("INFO")}
          className={cn(
            "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
            level === "INFO"
              ? "bg-sky-500 text-white border-sky-500 shadow-sm"
              : "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10 text-sky-500"
          )}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Info</span>
          <span className="text-[10px] font-mono">({counts.INFO})</span>
        </button>
      )}
    </div>
  );
}

export default LogLevelFilterBadges;
