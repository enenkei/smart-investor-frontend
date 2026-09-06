"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogLevelBadgeProps {
  level: string;
  className?: string;
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  const upper = (level || "INFO").toUpperCase();
  let color = "bg-muted text-muted-foreground border-border";
  let Icon = Info;

  if (upper === "ERROR" || upper === "CRITICAL") {
    color = "bg-rose-500/10 text-rose-500 border-rose-500/30";
    Icon = AlertCircle;
  } else if (upper === "WARNING" || upper === "WARN") {
    color = "bg-amber-500/10 text-amber-500 border-amber-500/30";
    Icon = AlertTriangle;
  } else if (upper === "INFO") {
    color = "bg-sky-500/10 text-sky-500 border-sky-500/30";
    Icon = Info;
  } else if (upper === "DEBUG") {
    color = "bg-purple-500/10 text-purple-500 border-purple-500/30";
    Icon = Terminal;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border gap-1 inline-flex items-center",
        color,
        className
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{upper}</span>
    </Badge>
  );
}

export default LogLevelBadge;
