"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Flame,
  ShieldCheck,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Sp500VisualizationProps {
  data: any[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
  totalResults?: number;
}

type ChartMode = "quality_value" | "momentum";

// Custom Tooltip for Quality vs Valuation
const QualityValueTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const ticker = item.ticker || item.symbol;
    const quality = Number(item.quality_score) || 0;
    const pe = item.pe_ratio != null ? Number(item.pe_ratio) : null;
    const isDoubleGreen = quality > 80 && item.rsi != null && item.rsi < 35;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-2xl text-xs min-w-[210px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2">
          <div className="font-black text-primary text-sm flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {ticker}
          </div>
          <div className="flex items-center gap-1">
            {isDoubleGreen && (
              <Badge className="bg-emerald-500 text-black text-[8px] font-black uppercase py-0 h-4">
                Double Green
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
              {item.sector || "Stock"}
            </Badge>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground truncate mb-2 max-w-[220px]" title={item.name}>
          {item.name}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
          <span className="text-muted-foreground">Quality Score:</span>
          <span className="text-right font-bold text-emerald-500">{quality.toFixed(0)} / 100</span>

          <span className="text-muted-foreground">P/E Ratio:</span>
          <span className="text-right font-bold text-indigo-400">
            {pe != null ? `${pe.toFixed(1)}x` : "N/A"}
          </span>

          <span className="text-muted-foreground">Div Yield:</span>
          <span className="text-right font-bold text-foreground">
            {item.dividend_yield != null ? `${(Number(item.dividend_yield) * (Number(item.dividend_yield) < 1 ? 100 : 1)).toFixed(2)}%` : "N/A"}
          </span>

          <span className="text-muted-foreground">RSI (14D):</span>
          <span className={cn(
            "text-right font-bold",
            item.rsi != null && item.rsi < 35 ? "text-emerald-500" : item.rsi != null && item.rsi > 65 ? "text-rose-500" : "text-foreground"
          )}>
            {item.rsi != null ? Number(item.rsi).toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Momentum / RSI
const MomentumTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const ticker = item.ticker || item.symbol;
    const rsi = item.rsi != null ? Number(item.rsi) : null;
    const quality = Number(item.quality_score) || 0;
    const isDoubleGreen = quality > 80 && rsi != null && rsi < 35;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-2xl text-xs min-w-[210px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2">
          <div className="font-black text-primary text-sm flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {ticker}
          </div>
          <div className="flex items-center gap-1">
            {isDoubleGreen && (
              <Badge className="bg-emerald-500 text-black text-[8px] font-black uppercase py-0 h-4">
                Double Green
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
              {item.sector || "Stock"}
            </Badge>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground truncate mb-2 max-w-[220px]" title={item.name}>
          {item.name}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
          <span className="text-muted-foreground">RSI (14D):</span>
          <span className={cn(
            "text-right font-bold",
            rsi != null && rsi < 35 ? "text-emerald-500" : rsi != null && rsi > 65 ? "text-rose-500" : "text-foreground"
          )}>
            {rsi != null ? (
              rsi < 35 ? `${rsi.toFixed(1)} (Oversold)` :
              rsi > 65 ? `${rsi.toFixed(1)} (Overbought)` :
              `${rsi.toFixed(1)} (Neutral)`
            ) : "N/A"}
          </span>

          <span className="text-muted-foreground">Quality Score:</span>
          <span className="text-right font-bold text-emerald-500">{quality.toFixed(0)} / 100</span>

          <span className="text-muted-foreground">P/E Ratio:</span>
          <span className="text-right font-bold text-indigo-400">
            {item.pe_ratio != null ? `${Number(item.pe_ratio).toFixed(1)}x` : "N/A"}
          </span>

          <span className="text-muted-foreground">Price:</span>
          <span className="text-right font-bold text-foreground">
            {item.current_price || item.prev_close ? `$${Number(item.current_price || item.prev_close).toFixed(2)}` : "N/A"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function Sp500Visualization({
  data,
  onSelectSymbol,
  selectedSymbol,
  totalResults
}: Sp500VisualizationProps) {
  const [chartMode, setChartMode] = React.useState<ChartMode>("quality_value");
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  // Transform data to ensure normalized quality scores and ticker field
  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const rawQuality = Number(item.quality_score) || 0;
      const quality = rawQuality <= 1 ? rawQuality * 100 : rawQuality;
      const ticker = item.ticker || item.symbol;
      const pe = item.pe_ratio != null ? Number(item.pe_ratio) : 0;
      const rsi = item.rsi != null ? Number(item.rsi) : 50;

      return {
        ...item,
        ticker,
        quality_score: quality,
        pe_ratio_clean: pe,
        rsi_clean: rsi,
      };
    });
  }, [data]);

  // Derived KPI statistics for the top summary cards
  const summary = React.useMemo(() => {
    if (!data.length) {
      return {
        topQuality: null,
        lowestPe: null,
        doubleGreenCount: 0,
      };
    }

    let topQualityItem: any = null;
    let lowestPeItem: any = null;
    let doubleGreenCount = 0;

    data.forEach((item) => {
      const rawQuality = Number(item.quality_score) || 0;
      const quality = rawQuality <= 1 ? rawQuality * 100 : rawQuality;
      const pe = item.pe_ratio != null ? Number(item.pe_ratio) : null;
      const rsi = item.rsi != null ? Number(item.rsi) : null;

      if (topQualityItem == null || quality > (Number(topQualityItem.quality_score_normalized) || 0)) {
        topQualityItem = { ...item, quality_score_normalized: quality };
      }

      if (pe != null && pe > 0) {
        if (lowestPeItem == null || pe < Number(lowestPeItem.pe_ratio)) {
          lowestPeItem = item;
        }
      }

      if (quality > 80 && rsi != null && rsi < 35) {
        doubleGreenCount++;
      }
    });

    return {
      topQuality: topQualityItem,
      lowestPe: lowestPeItem,
      doubleGreenCount,
    };
  }, [data]);

  return (
    <Card className="border border-border/40 bg-card/20 backdrop-blur-md rounded-none shadow-xl overflow-hidden">
      {/* Top Header & Toolbar */}
      <CardHeader className="p-4 pb-3 border-b border-border/30 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)] animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
              S&P 500 Hunter Intelligence
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-primary/20 text-primary">
              Page View ({data.length} Stocks)
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-none bg-background/60 p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => setChartMode("quality_value")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all",
                  chartMode === "quality_value"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3 h-3" />
                Quality vs Value
              </button>
              <button
                type="button"
                onClick={() => setChartMode("momentum")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all",
                  chartMode === "momentum"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TrendingUp className="w-3 h-3" />
                Momentum & RSI
              </button>
            </div>

            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/30"
              title={isCollapsed ? "Expand visualization" : "Collapse visualization"}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 mr-1" />
                  Show
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 mr-1" />
                  Hide
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* KPI Summary Chips Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Matching Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3 text-primary" />
              Opportunities Located
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-foreground">
                {totalResults ?? data.length}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">stocks</span>
            </div>
          </div>

          {/* Top Quality Stock */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Top Quality in View
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-emerald-500">
                {summary.topQuality ? `${Number(summary.topQuality.quality_score_normalized).toFixed(0)} / 100` : "-"}
              </span>
              {summary.topQuality && (
                <button
                  type="button"
                  onClick={() => onSelectSymbol(summary.topQuality.ticker || summary.topQuality.symbol)}
                  className="text-[10px] font-black font-mono text-primary hover:underline"
                >
                  {summary.topQuality.ticker || summary.topQuality.symbol}
                </button>
              )}
            </div>
          </div>

          {/* Lowest P/E Ratio Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Best Value (Lowest P/E)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-indigo-400">
                {summary.lowestPe?.pe_ratio != null
                  ? `${Number(summary.lowestPe.pe_ratio).toFixed(1)}x`
                  : "-"}
              </span>
              {summary.lowestPe && (
                <button
                  type="button"
                  onClick={() => onSelectSymbol(summary.lowestPe.ticker || summary.lowestPe.symbol)}
                  className="text-[10px] font-black font-mono text-primary hover:underline"
                >
                  {summary.lowestPe.ticker || summary.lowestPe.symbol}
                </button>
              )}
            </div>
          </div>

          {/* Double Green Hunter Signals */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-500" />
              "Double Green" Signals
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-black font-mono",
                summary.doubleGreenCount > 0 ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {summary.doubleGreenCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {summary.doubleGreenCount === 1 ? "priority target" : "priority targets"}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Chart Canvas */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {chartData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground italic border border-dashed border-border/40">
                  No stock data available for visualization.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Legend & Instructions */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <div className="flex items-center gap-4">
                      {chartMode === "quality_value" ? (
                        <>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500" />
                            Quality Score (0-100)
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-indigo-500" />
                            P/E Ratio
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500" />
                            Oversold / Double Green (RSI &lt; 35)
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-indigo-500" />
                            Neutral Momentum
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-rose-500" />
                            Overbought (RSI &gt; 65)
                          </div>
                        </>
                      )}
                    </div>
                    <span className="italic text-[10px]">Click any bar to highlight stock</span>
                  </div>

                  {/* Chart Container */}
                  <div className="h-[240px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === "quality_value" ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, bottom: 20, left: -10 }}
                          barCategoryGap="20%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis
                            dataKey="ticker"
                            stroke="#71717a"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={10}
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<QualityValueTooltip />}
                            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                          />
                          {/* Quality Score Bar */}
                          <Bar
                            dataKey="quality_score"
                            name="Quality Score"
                            fill="#10b981"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.ticker && onSelectSymbol(item.ticker)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.ticker;
                              const isDoubleGreen = (entry.quality_score || 0) > 80 && (entry.rsi || 0) < 35;
                              return (
                                <Cell
                                  key={`qual-${index}`}
                                  fill="#10b981"
                                  fillOpacity={selectedSymbol ? (isSelected ? 1 : 0.3) : 0.85}
                                  stroke={isSelected ? "#ffffff" : isDoubleGreen ? "#10b981" : "transparent"}
                                  strokeWidth={isSelected ? 2 : isDoubleGreen ? 1.5 : 0}
                                  className="transition-all duration-200"
                                />
                              );
                            })}
                          </Bar>
                          {/* P/E Ratio Bar */}
                          <Bar
                            dataKey="pe_ratio_clean"
                            name="P/E Ratio"
                            fill="#6366f1"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.ticker && onSelectSymbol(item.ticker)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.ticker;
                              return (
                                <Cell
                                  key={`pe-${index}`}
                                  fill="#6366f1"
                                  fillOpacity={selectedSymbol ? (isSelected ? 1 : 0.3) : 0.85}
                                  stroke={isSelected ? "#ffffff" : "transparent"}
                                  strokeWidth={isSelected ? 2 : 0}
                                  className="transition-all duration-200"
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, bottom: 20, left: -10 }}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <ReferenceLine y={35} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                          <XAxis
                            dataKey="ticker"
                            stroke="#71717a"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={10}
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<MomentumTooltip />}
                            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                          />
                          <Bar
                            dataKey="rsi_clean"
                            name="RSI (14D)"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.ticker && onSelectSymbol(item.ticker)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.ticker;
                              const isOversold = (entry.rsi || 0) < 35;
                              const isOverbought = (entry.rsi || 0) > 65;
                              const isDoubleGreen = (entry.quality_score || 0) > 80 && isOversold;
                              const baseColor = isDoubleGreen || isOversold ? "#10b981" : isOverbought ? "#f43f5e" : "#6366f1";

                              return (
                                <Cell
                                  key={`rsi-${index}`}
                                  fill={baseColor}
                                  fillOpacity={selectedSymbol ? (isSelected ? 1 : 0.3) : 0.85}
                                  stroke={isSelected ? "#ffffff" : isDoubleGreen ? "#10b981" : "transparent"}
                                  strokeWidth={isSelected ? 2 : isDoubleGreen ? 1.5 : 0}
                                  className="transition-all duration-200"
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
