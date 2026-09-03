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
  Coins
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

export interface StockFilterState {
  // Valuation
  maxPe: string;          // "any" | "15" | "20" | "25" | "35" | "50"
  minFcfYield: string;    // "any" | "0" | "0.03" | "0.05" | "0.08" | "0.10"
  maxDe: string;          // "any" | "0.5" | "1.0" | "2.0"
  
  // Dividends & Growth
  minYield: string;       // "any" | "0.01" | "0.02" | "0.03" | "0.04" | "0.05"
  minCagr: string;        // "any" | "0.05" | "0.08" | "0.10" | "0.15"
  maxPayout: string;      // "any" | "40" | "60" | "70" | "80"
  
  // Technical & Risk
  rsiMode: string;        // "any" | "oversold" | "neutral" | "overbought"
  beta: string;           // "any" | "low" | "moderate" | "high"
  
  // Quality & Health
  minQuality: string;     // "any" | "50" | "70" | "80"
  minMargin: string;      // "any" | "0.10" | "0.15" | "0.20" | "0.30"
}

export const DEFAULT_FILTERS: StockFilterState = {
  maxPe: "any",
  minFcfYield: "any",
  maxDe: "any",
  minYield: "any",
  minCagr: "any",
  maxPayout: "any",
  rsiMode: "any",
  beta: "any",
  minQuality: "50", // Default: exclude unpopulated or bottom junk stocks
  minMargin: "any",
};

interface Preset {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  filters: Partial<StockFilterState>;
}

export const PRESETS: Preset[] = [
  {
    id: "hunter_priority",
    label: "Hunter Priority",
    description: "Quality >75, Oversold (RSI <35), P/E <30, Yield >1.5%",
    icon: Flame,
    filters: {
      minQuality: "75",
      rsiMode: "oversold",
      maxPe: "30",
      minYield: "0.01",
    },
  },
  {
    id: "value_compounder",
    label: "Value Compounder",
    description: "P/E <25, Div Growth >8%, Payout <60%, Quality >70",
    icon: Sparkles,
    filters: {
      maxPe: "25",
      minYield: "0.02",
      minCagr: "0.08",
      maxPayout: "60",
      minQuality: "70",
    },
  },
  {
    id: "deep_value",
    label: "Deep Value",
    description: "P/E <15, FCF Yield >5%, Quality >50",
    icon: Coins,
    filters: {
      maxPe: "15",
      minFcfYield: "0.05",
      minQuality: "50",
    },
  },
  {
    id: "oversold_bounce",
    label: "Oversold Bounce",
    description: "RSI <35 with strong Quality Score >70",
    icon: TrendingDown,
    filters: {
      rsiMode: "oversold",
      minQuality: "70",
    },
  },
  {
    id: "cash_cow",
    label: "Cash Cow",
    description: "FCF Yield >8%, Margin >20%, D/E <1.0",
    icon: ShieldAlert,
    filters: {
      minFcfYield: "0.08",
      minMargin: "0.20",
      maxDe: "1.0",
      minQuality: "60",
    },
  },
];

interface Sp500FilterBarProps {
  filters: StockFilterState;
  onFilterChange: (key: keyof StockFilterState, value: string) => void;
  onApplyPreset: (presetId: string, presetFilters: Partial<StockFilterState>) => void;
  onResetFilters: () => void;
  activePresetId?: string | null;
}

export function Sp500FilterBar({
  filters,
  onFilterChange,
  onApplyPreset,
  onResetFilters,
  activePresetId,
}: Sp500FilterBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active non-default filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    (Object.keys(filters) as (keyof StockFilterState)[]).forEach((key) => {
      if (key === "minQuality") {
        if (filters[key] !== "50" && filters[key] !== "any") count++;
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
          {PRESETS.map((preset) => {
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
            <span>Screener Filters</span>
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
              {/* 1. Valuation Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                  <span>Valuation</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">P/E Ratio:</span>
                    <Select value={filters.maxPe} onValueChange={(v) => onFilterChange("maxPe", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any P/E</SelectItem>
                        <SelectItem value="15">&lt; 15 (Value)</SelectItem>
                        <SelectItem value="20">&lt; 20 (Modest)</SelectItem>
                        <SelectItem value="25">&lt; 25 (Reasonable)</SelectItem>
                        <SelectItem value="35">&lt; 35 (Growth)</SelectItem>
                        <SelectItem value="50">&lt; 50 (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">FCF Yield:</span>
                    <Select value={filters.minFcfYield} onValueChange={(v) => onFilterChange("minFcfYield", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0">&gt; 0% (Positive)</SelectItem>
                        <SelectItem value="0.03">&gt; 3%</SelectItem>
                        <SelectItem value="0.05">&gt; 5% (Strong)</SelectItem>
                        <SelectItem value="0.08">&gt; 8% (High)</SelectItem>
                        <SelectItem value="0.10">&gt; 10% (Elite)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Debt / Equity:</span>
                    <Select value={filters.maxDe} onValueChange={(v) => onFilterChange("maxDe", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0.5">&lt; 0.5 (Very Low)</SelectItem>
                        <SelectItem value="1.0">&lt; 1.0 (Healthy)</SelectItem>
                        <SelectItem value="2.0">&lt; 2.0 (Moderate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 2. Dividends & Growth Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Dividends & Growth</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Div Yield:</span>
                    <Select value={filters.minYield} onValueChange={(v) => onFilterChange("minYield", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0.01">&gt; 1%</SelectItem>
                        <SelectItem value="0.02">&gt; 2%</SelectItem>
                        <SelectItem value="0.03">&gt; 3%</SelectItem>
                        <SelectItem value="0.04">&gt; 4%</SelectItem>
                        <SelectItem value="0.05">&gt; 5% (High Yield)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">5Y CAGR:</span>
                    <Select value={filters.minCagr} onValueChange={(v) => onFilterChange("minCagr", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0.05">&gt; 5% / yr</SelectItem>
                        <SelectItem value="0.08">&gt; 8% / yr</SelectItem>
                        <SelectItem value="0.10">&gt; 10% / yr</SelectItem>
                        <SelectItem value="0.15">&gt; 15% / yr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Payout Ratio:</span>
                    <Select value={filters.maxPayout} onValueChange={(v) => onFilterChange("maxPayout", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="40">&lt; 40% (Conservative)</SelectItem>
                        <SelectItem value="60">&lt; 60% (Healthy)</SelectItem>
                        <SelectItem value="70">&lt; 70%</SelectItem>
                        <SelectItem value="80">&lt; 80%</SelectItem>
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
                </div>
              </div>

              {/* 4. Quality & Health Column */}
              <div className="space-y-2 bg-background/20 p-2.5 border border-border/30">
                <div className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center justify-between">
                  <span>Quality & Health</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Min Quality:</span>
                    <Select value={filters.minQuality} onValueChange={(v) => onFilterChange("minQuality", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Default (50)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any (All)</SelectItem>
                        <SelectItem value="50">Good (&gt; 50)</SelectItem>
                        <SelectItem value="70">Strong (&gt; 70)</SelectItem>
                        <SelectItem value="80">Elite (&gt; 80)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Oper Margin:</span>
                    <Select value={filters.minMargin} onValueChange={(v) => onFilterChange("minMargin", v)}>
                      <SelectTrigger className="w-[110px] h-7 text-[11px] font-semibold bg-background/50 border-border/40">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="0.10">&gt; 10%</SelectItem>
                        <SelectItem value="0.15">&gt; 15%</SelectItem>
                        <SelectItem value="0.20">&gt; 20%</SelectItem>
                        <SelectItem value="0.30">&gt; 30%</SelectItem>
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
