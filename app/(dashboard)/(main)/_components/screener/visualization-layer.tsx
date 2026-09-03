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
  Percent,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VisualizationLayerProps {
  data: any[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
  totalResults?: number;
}

type ChartMode = "efficiency" | "momentum";

// Custom Tooltip for Yield vs Expense
const EfficiencyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const yieldVal = item.annual_dividend_yield_pct != null ? Number(item.annual_dividend_yield_pct) : 0;
    const expenseVal = item.expense_ratio_pct != null ? Number(item.expense_ratio_pct) : 0;
    const spread = yieldVal - expenseVal;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-2xl text-xs min-w-[200px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2">
          <div className="font-black text-primary text-sm flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {item.symbol}
          </div>
          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
            {item.asset_class || "ETF"}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground truncate mb-2 max-w-[220px]" title={item.etf_name}>
          {item.etf_name}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
          <span className="text-muted-foreground">Div Yield:</span>
          <span className="text-right font-bold text-emerald-500">{yieldVal.toFixed(2)}%</span>

          <span className="text-muted-foreground">Expense Ratio:</span>
          <span className="text-right font-bold text-indigo-400">{expenseVal.toFixed(2)}%</span>

          <span className="text-muted-foreground">Net Spread:</span>
          <span className={cn(
            "text-right font-bold",
            spread > 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {spread > 0 ? "+" : ""}{spread.toFixed(2)}%
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

// Custom Tooltip for Momentum / YTD
const MomentumTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const ytd = item.ytd_price_change != null ? Number(item.ytd_price_change) : 0;
    const oneMonth = item.one_month_perf != null ? Number(item.one_month_perf) : null;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 p-3 rounded-lg shadow-2xl text-xs min-w-[200px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2">
          <div className="font-black text-primary text-sm flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {item.symbol}
          </div>
          <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
            {item.asset_class || "ETF"}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground truncate mb-2 max-w-[220px]" title={item.etf_name}>
          {item.etf_name}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
          <span className="text-muted-foreground">YTD Return:</span>
          <span className={cn("text-right font-bold", ytd >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {ytd >= 0 ? "+" : ""}{ytd.toFixed(2)}%
          </span>

          <span className="text-muted-foreground">1-Month Perf:</span>
          <span className={cn("text-right font-bold", oneMonth != null && oneMonth >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {oneMonth != null ? `${oneMonth >= 0 ? "+" : ""}${oneMonth.toFixed(2)}%` : "N/A"}
          </span>

          <span className="text-muted-foreground">RSI Status:</span>
          <span className={cn(
            "text-right font-bold",
            item.rsi != null && item.rsi < 35 ? "text-emerald-500" : item.rsi != null && item.rsi > 65 ? "text-rose-500" : "text-foreground"
          )}>
            {item.rsi != null ? (
              item.rsi < 35 ? `${Number(item.rsi).toFixed(1)} (Oversold)` :
              item.rsi > 65 ? `${Number(item.rsi).toFixed(1)} (Overbought)` :
              `${Number(item.rsi).toFixed(1)} (Neutral)`
            ) : "N/A"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function VisualizationLayer({
  data,
  onSelectSymbol,
  selectedSymbol,
  totalResults
}: VisualizationLayerProps) {
  const [chartMode, setChartMode] = React.useState<ChartMode>("efficiency");
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  // Transform data for chart consumption
  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const expensePct = item.expense_ratio != null ? Number(item.expense_ratio) * 100 : 0;
      const yieldPct = item.annual_dividend_yield_pct != null ? Number(item.annual_dividend_yield_pct) : 0;
      const ytd = item.ytd_price_change != null ? Number(item.ytd_price_change) : 0;

      return {
        ...item,
        expense_ratio_pct: expensePct,
        annual_dividend_yield_pct: yieldPct,
        ytd_price_change: ytd,
      };
    });
  }, [data]);

  // Derived KPI statistics for the top summary cards
  const summary = React.useMemo(() => {
    if (!data.length) {
      return {
        topYield: null,
        lowestExpense: null,
        oversoldCount: 0,
        avgYield: 0,
      };
    }

    let topYieldItem = data[0];
    let lowestExpenseItem: any = null;
    let oversoldCount = 0;
    let yieldSum = 0;
    let yieldCount = 0;

    data.forEach((item) => {
      const y = Number(item.annual_dividend_yield_pct);
      const e = Number(item.expense_ratio);
      const rsi = Number(item.rsi);

      if (!isNaN(y) && y != null) {
        yieldSum += y;
        yieldCount++;
        if (!topYieldItem || y > Number(topYieldItem.annual_dividend_yield_pct || 0)) {
          topYieldItem = item;
        }
      }

      if (!isNaN(e) && e != null && e >= 0) {
        if (!lowestExpenseItem || e < Number(lowestExpenseItem.expense_ratio ?? 999)) {
          lowestExpenseItem = item;
        }
      }

      if (!isNaN(rsi) && rsi != null && rsi < 35) {
        oversoldCount++;
      }
    });

    return {
      topYield: topYieldItem,
      lowestExpense: lowestExpenseItem,
      oversoldCount,
      avgYield: yieldCount > 0 ? yieldSum / yieldCount : 0,
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
              ETF Comparative Intelligence
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-primary/20 text-primary">
              Page View ({data.length} Funds)
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-none bg-background/60 p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => setChartMode("efficiency")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all",
                  chartMode === "efficiency"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="w-3 h-3" />
                Yield vs Fee
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
                Performance & RSI
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
          {/* Opportunities Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Layers className="w-3 h-3 text-primary" />
              Total Matching
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black font-mono text-foreground">
                {totalResults ?? data.length}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">funds</span>
            </div>
          </div>

          {/* Top Yield Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Percent className="w-3 h-3 text-emerald-500" />
              Top Yield in View
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-emerald-500">
                {summary.topYield?.annual_dividend_yield_pct != null
                  ? `${Number(summary.topYield.annual_dividend_yield_pct).toFixed(2)}%`
                  : "-"}
              </span>
              {summary.topYield && (
                <button
                  type="button"
                  onClick={() => onSelectSymbol(summary.topYield.symbol)}
                  className="text-[10px] font-black font-mono text-primary hover:underline"
                >
                  {summary.topYield.symbol}
                </button>
              )}
            </div>
          </div>

          {/* Lowest Expense Ratio Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Lowest Expense
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-black font-mono text-indigo-400">
                {summary.lowestExpense?.expense_ratio != null
                  ? `${(Number(summary.lowestExpense.expense_ratio) * 100).toFixed(2)}%`
                  : "-"}
              </span>
              {summary.lowestExpense && (
                <button
                  type="button"
                  onClick={() => onSelectSymbol(summary.lowestExpense.symbol)}
                  className="text-[10px] font-black font-mono text-primary hover:underline"
                >
                  {summary.lowestExpense.symbol}
                </button>
              )}
            </div>
          </div>

          {/* Oversold Alert Tile */}
          <div className="bg-background/40 border border-border/40 p-3 rounded-none flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Oversold (RSI &lt; 35)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-black font-mono",
                summary.oversoldCount > 0 ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {summary.oversoldCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {summary.oversoldCount === 1 ? "fund ready" : "funds ready"}
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
                  No ETF data available for visualization.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Legend & Instructions */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <div className="flex items-center gap-4">
                      {chartMode === "efficiency" ? (
                        <>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500" />
                            Dividend Yield (%)
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-indigo-500" />
                            Expense Ratio (%)
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-emerald-500" />
                            Positive Return
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2.5 h-2.5 rounded-none bg-rose-500" />
                            Negative Return
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                            • Dot on bar = Oversold Signal (RSI &lt; 35)
                          </div>
                        </>
                      )}
                    </div>
                    <span className="italic text-[10px]">Click any bar to highlight fund</span>
                  </div>

                  {/* Chart Container */}
                  <div className="h-[240px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === "efficiency" ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, bottom: 20, left: -10 }}
                          barCategoryGap="20%"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis
                            dataKey="symbol"
                            stroke="#71717a"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={10}
                            unit="%"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<EfficiencyTooltip />}
                            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                          />
                          {/* Dividend Yield Bar */}
                          <Bar
                            dataKey="annual_dividend_yield_pct"
                            name="Dividend Yield"
                            fill="#10b981"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.symbol && onSelectSymbol(item.symbol)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.symbol;
                              return (
                                <Cell
                                  key={`yield-${index}`}
                                  fill="#10b981"
                                  fillOpacity={selectedSymbol ? (isSelected ? 1 : 0.3) : 0.85}
                                  stroke={isSelected ? "#ffffff" : "transparent"}
                                  strokeWidth={isSelected ? 2 : 0}
                                  className="transition-all duration-200"
                                />
                              );
                            })}
                          </Bar>
                          {/* Expense Ratio Bar */}
                          <Bar
                            dataKey="expense_ratio_pct"
                            name="Expense Ratio"
                            fill="#6366f1"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.symbol && onSelectSymbol(item.symbol)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.symbol;
                              return (
                                <Cell
                                  key={`exp-${index}`}
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
                          <ReferenceLine y={0} stroke="#52525b" strokeWidth={1} />
                          <XAxis
                            dataKey="symbol"
                            stroke="#71717a"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={10}
                            unit="%"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<MomentumTooltip />}
                            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                          />
                          <Bar
                            dataKey="ytd_price_change"
                            name="YTD Return"
                            radius={[2, 2, 0, 0]}
                            onClick={(item: any) => item?.symbol && onSelectSymbol(item.symbol)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => {
                              const isSelected = selectedSymbol === entry.symbol;
                              const isPos = (entry.ytd_price_change ?? 0) >= 0;
                              const baseColor = isPos ? "#10b981" : "#f43f5e";
                              return (
                                <Cell
                                  key={`ytd-${index}`}
                                  fill={baseColor}
                                  fillOpacity={selectedSymbol ? (isSelected ? 1 : 0.3) : 0.85}
                                  stroke={isSelected ? "#ffffff" : entry.rsi != null && entry.rsi < 35 ? "#10b981" : "transparent"}
                                  strokeWidth={isSelected ? 2 : entry.rsi != null && entry.rsi < 35 ? 1.5 : 0}
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
