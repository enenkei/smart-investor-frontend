"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Flame,
  TrendingDown,
  Coins,
  Layers,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EtfFilterState {
  // Cost & Structure
  maxExpense: string;     // "any" | "0.10" | "0.20" | "0.50" | "0.75" | "1.00"
  isLeveraged: string;    // "any" | "false" | "true"
  isInverse: string;      // "any" | "false" | "true"
  
  // Dividends & Yield
  minYield: string;       // "any" | "1" | "2" | "3" | "4" | "5"
  dividendRating: string; // "All" | "A" | "B" | "C" | "D"
  
  // Technical & Risk
  rsiMode: string;        // "any" | "oversold" | "neutral" | "overbought"
  beta: string;           // "any" | "low" | "moderate" | "high"
  volatilityRating: string; // "All" | "A" | "B" | "C" | "D"
  
  // Liquidity & Size
  minAssets: string;      // "any" | "100000000" (100M) | "500000000" (500M) | "1000000000" (1B) | "5000000000" (5B) | "10000000000" (10B)
  expensesRating: string; // "All" | "A" | "B" | "C" | "D"
  liquidityRating: string; // "All" | "A" | "B" | "C" | "D"
}

export const DEFAULT_ETF_FILTERS: EtfFilterState = {
  maxExpense: "any",
  isLeveraged: "any",
  isInverse: "any",
  minYield: "any",
  dividendRating: "All",
  rsiMode: "any",
  beta: "any",
  volatilityRating: "All",
  minAssets: "any",
  expensesRating: "All",
  liquidityRating: "All",
};

interface Preset {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filters: Partial<EtfFilterState>;
}

export const ETF_PRESETS: Preset[] = [
  {
    id: "low_cost_core",
    label: "Low-Cost Core",
    description: "Expense < 0.15%, Assets > $1B, Non-leveraged",
    icon: Sparkles,
    filters: {
      maxExpense: "0.20",
      minAssets: "1000000000",
      isLeveraged: "false",
      isInverse: "false",
    },
  },
  {
    id: "high_yield_income",
    label: "High Yield",
    description: "Yield > 3.5%, Dividend Rating A or B",
    icon: Coins,
    filters: {
      minYield: "3.5",
      isLeveraged: "false",
      dividendRating: "A",
    },
  },
  {
    id: "oversold_dip",
    label: "Oversold Dip",
    description: "RSI < 35, Non-leveraged",
    icon: TrendingDown,
    filters: {
      rsiMode: "oversold",
      isLeveraged: "false",
    },
  },
  {
    id: "mega_cap_liquids",
    label: "Mega-Cap Giants",
    description: "Assets > $10B, Expense < 0.30%",
    icon: Layers,
    filters: {
      minAssets: "10000000000",
      maxExpense: "0.30",
      isLeveraged: "false",
    },
  },
  {
    id: "leveraged_trading",
    label: "Leveraged & Trading",
    description: "Leveraged or Inverse tactical instruments",
    icon: Zap,
    filters: {
      isLeveraged: "true",
    },
  },
];

interface EtfFilterBarProps {
  filters: EtfFilterState;
  onFilterChange: (key: keyof EtfFilterState, value: string) => void;
  onApplyPreset: (presetId: string, presetFilters: Partial<EtfFilterState>) => void;
  onResetFilters: () => void;
  activePresetId?: string | null;
}

export function EtfFilterBar({
  filters,
  onFilterChange,
  onApplyPreset,
  onResetFilters,
  activePresetId,
}: EtfFilterBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active non-default filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    (Object.keys(filters) as (keyof EtfFilterState)[]).forEach((key) => {
      if (key.includes("Rating")) {
        if (filters[key] !== "All") count++;
      } else if (filters[key] !== "any") {
        count++;
      }
    });
    return count;
  }, [filters]);

  return (
    <div className="w-full bg-card/20 backdrop-blur-md border border-border/60 rounded-none p-3.5 space-y-3">
      {/* Top Header Row: Presets & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Presets Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground mr-1 shrink-0">
            Quick Scans:
          </span>
          {ETF_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePresetId === preset.id;
            return (
              <Button
                key={preset.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onApplyPreset(preset.id, preset.filters)}
                title={preset.description}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-none shrink-0 transition-all gap-1.5",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/40 hover:bg-background/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-primary")} />
                {preset.label}
              </Button>
            );
          })}
        </div>

        {/* Filter Toggle & Reset */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              "h-7 px-3 text-xs font-black uppercase rounded-none border gap-2 transition-all",
              isOpen || activeFilterCount > 0
                ? "border-primary/50 text-foreground bg-primary/10"
                : "text-muted-foreground bg-background/30 hover:bg-background/60"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>ETF Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="h-4 px-1.5 text-[9px] font-black bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Finviz-Style Multi-Column Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 pt-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
              {/* 1. Cost & Structure Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                  <span>Cost & Structure</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Expense Ratio:</span>
                    <Select value={filters.maxExpense} onValueChange={(v) => onFilterChange("maxExpense", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Expense</SelectItem>
                        <SelectItem value="0.10">&lt; 0.10% (Ultra Low)</SelectItem>
                        <SelectItem value="0.20">&lt; 0.20% (Low)</SelectItem>
                        <SelectItem value="0.50">&lt; 0.50% (Standard)</SelectItem>
                        <SelectItem value="0.75">&lt; 0.75%</SelectItem>
                        <SelectItem value="1.00">&lt; 1.00%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Leveraged:</span>
                    <Select value={filters.isLeveraged} onValueChange={(v) => onFilterChange("isLeveraged", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="false">Non-Leveraged</SelectItem>
                        <SelectItem value="true">Leveraged (2x/3x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Inverse:</span>
                    <Select value={filters.isInverse} onValueChange={(v) => onFilterChange("isInverse", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="false">Regular (Long)</SelectItem>
                        <SelectItem value="true">Inverse (Short)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 2. Dividends & Income Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Dividends & Income</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Annual Yield:</span>
                    <Select value={filters.minYield} onValueChange={(v) => onFilterChange("minYield", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Yield</SelectItem>
                        <SelectItem value="1">&gt; 1%</SelectItem>
                        <SelectItem value="2">&gt; 2%</SelectItem>
                        <SelectItem value="3">&gt; 3%</SelectItem>
                        <SelectItem value="4">&gt; 4%</SelectItem>
                        <SelectItem value="5">&gt; 5% (High Yield)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Div Rating:</span>
                    <Select value={filters.dividendRating} onValueChange={(v) => onFilterChange("dividendRating", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ratings</SelectItem>
                        <SelectItem value="A">A (Top)</SelectItem>
                        <SelectItem value="B">B (Above Avg)</SelectItem>
                        <SelectItem value="C">C (Average)</SelectItem>
                        <SelectItem value="D">D (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3. Technical & Risk Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Technical & Risk</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">RSI (14D):</span>
                    <Select value={filters.rsiMode} onValueChange={(v) => onFilterChange("rsiMode", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any RSI</SelectItem>
                        <SelectItem value="oversold">Oversold (&lt; 35)</SelectItem>
                        <SelectItem value="neutral">Neutral (35 - 65)</SelectItem>
                        <SelectItem value="overbought">Overbought (&gt; 65)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Beta / Risk:</span>
                    <Select value={filters.beta} onValueChange={(v) => onFilterChange("beta", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Beta</SelectItem>
                        <SelectItem value="low">Low Beta (&lt; 0.8)</SelectItem>
                        <SelectItem value="moderate">Market (0.8 - 1.2)</SelectItem>
                        <SelectItem value="high">High Beta (&gt; 1.2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Vol Rating:</span>
                    <Select value={filters.volatilityRating} onValueChange={(v) => onFilterChange("volatilityRating", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ratings</SelectItem>
                        <SelectItem value="A">A (Lowest Risk)</SelectItem>
                        <SelectItem value="B">B (Moderate)</SelectItem>
                        <SelectItem value="C">C (High)</SelectItem>
                        <SelectItem value="D">D (Highest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 4. Liquidity & Size Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center justify-between">
                  <span>Liquidity & Size</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Total Assets:</span>
                    <Select value={filters.minAssets} onValueChange={(v) => onFilterChange("minAssets", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Size</SelectItem>
                        <SelectItem value="100000000">&gt; $100M</SelectItem>
                        <SelectItem value="500000000">&gt; $500M</SelectItem>
                        <SelectItem value="1000000000">&gt; $1B (Liquid)</SelectItem>
                        <SelectItem value="5000000000">&gt; $5B (Large)</SelectItem>
                        <SelectItem value="10000000000">&gt; $10B (Mega)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Expenses Rtg:</span>
                    <Select value={filters.expensesRating} onValueChange={(v) => onFilterChange("expensesRating", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ratings</SelectItem>
                        <SelectItem value="A">A (Cheapest)</SelectItem>
                        <SelectItem value="B">B (Low Fee)</SelectItem>
                        <SelectItem value="C">C (Average)</SelectItem>
                        <SelectItem value="D">D (Expensive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Liquidity Rtg:</span>
                    <Select value={filters.liquidityRating} onValueChange={(v) => onFilterChange("liquidityRating", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ratings</SelectItem>
                        <SelectItem value="A">A (Most Liquid)</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
