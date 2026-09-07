"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STRATEGY_THEMES, MODES, StrategyTheme, StrategyMode } from "./types";
import { RotateCw, Sparkles, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategySelectorBarProps {
  selectedThemeId: string;
  selectedMode: StrategyMode;
  onSelectTheme: (themeId: string) => void;
  onSelectMode: (mode: StrategyMode) => void;
  onRegenerate: () => Promise<void>;
  isRegenerating: boolean;
  onReset: () => void;
}

export function StrategySelectorBar({
  selectedThemeId,
  selectedMode,
  onSelectTheme,
  onSelectMode,
  onRegenerate,
  isRegenerating,
  onReset,
}: StrategySelectorBarProps) {
  return (
    <div className="flex flex-col gap-4 border border-border/50 bg-card/20 backdrop-blur-xl p-4 md:p-5 rounded-none shadow-sm">
      {/* Top row: Section Header & Mode Toggle & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-none bg-primary/10 border border-primary/20 text-primary">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Quantitative Strategies</h3>
            <p className="text-xs text-muted-foreground">Derived dynamically from quantitative fundamental & ETF scores</p>
          </div>
        </div>

        {/* Mode Selector (Stocks / ETF / Mix) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background/60 border border-border/60 p-0.5 rounded-none">
            {MODES.map((m) => {
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(m.id)}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 rounded-none",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                  title={m.description}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Regenerate Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="h-8 rounded-none border-border/60 text-xs font-bold uppercase tracking-wider gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            title="Refresh quantitative baskets from the latest database scores"
          >
            <RotateCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin text-primary")} />
            <span className="hidden sm:inline">{isRegenerating ? "Re-Optimizing..." : "Re-Calculate"}</span>
          </Button>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2.5 rounded-none text-xs text-muted-foreground hover:text-foreground"
            title="Reset to Total Return Titan (Hybrid)"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Theme Pills Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-border/40">
        {STRATEGY_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          const Icon = theme.icon;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={cn(
                "flex flex-col items-start p-3 text-left transition-all duration-200 border rounded-none relative group",
                isSelected
                  ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/30"
                  : "bg-background/40 border-border/50 text-muted-foreground hover:border-border hover:bg-muted/20 hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <Icon className={cn("w-4 h-4 transition-colors", isSelected ? "text-primary" : theme.color)} />
                {isSelected && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary uppercase font-mono">
                    Active
                  </Badge>
                )}
              </div>
              <span className="text-xs font-bold tracking-tight text-foreground line-clamp-1">{theme.name}</span>
              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{theme.tagline}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
