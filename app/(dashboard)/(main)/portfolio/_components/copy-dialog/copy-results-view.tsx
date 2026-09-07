"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Activity,
  Target,
  DollarSign,
  ChevronLeft,
  BookmarkCheck,
  Loader2,
  Table as TableIcon,
  LineChart as ChartIcon,
  CalendarCheck,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { OptimizedPortfolio } from "@/lib/data-types";
import { formatPct, formatCurrency } from "./types";

interface CopyResultsViewProps {
  optimizationResult: OptimizedPortfolio;
  budget: string;
  monthlyContribution: string;
  portfolioName: string;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
}

export function CopyResultsView({
  optimizationResult,
  budget,
  monthlyContribution,
  portfolioName,
  isSaving,
  onSave,
  onBack,
}: CopyResultsViewProps) {
  const metrics = optimizationResult.metrics;
  const totalBudgetNum = parseFloat(budget || "10000");

  const riskLabel =
    metrics.volatility < 0.12 || (metrics.volatility > 1 && metrics.volatility < 12)
      ? "Low Risk"
      : metrics.volatility < 0.18 || (metrics.volatility > 1 && metrics.volatility < 18)
      ? "Moderate Risk"
      : "Aggressive Risk";

  const riskColor =
    riskLabel === "Low Risk" ? "text-emerald-400" : riskLabel === "Moderate Risk" ? "text-amber-400" : "text-rose-400";

  // Sorted tickers by weight
  const sortedTickers = React.useMemo(() => {
    return [...optimizationResult.tickers].sort(
      (a, b) => (optimizationResult.weights[b] ?? 0) - (optimizationResult.weights[a] ?? 0)
    );
  }, [optimizationResult.tickers, optimizationResult.weights]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* 4 Sleek KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Exp Return */}
        <div className="border border-emerald-500/25 bg-emerald-500/10 p-3 flex flex-col justify-between rounded-none">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Exp. Return</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight mt-1">
            {formatPct(metrics.expected_return)}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Annualized model rate</span>
        </div>

        {/* Volatility */}
        <div className="border border-primary/25 bg-primary/10 p-3 flex flex-col justify-between rounded-none">
          <div className="flex items-center justify-between text-primary">
            <span className="text-[10px] font-black uppercase tracking-widest">Exp. Volatility</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-black font-mono text-foreground tracking-tight mt-1">
            {formatPct(metrics.volatility)}
          </span>
          <span className={`text-[9px] font-semibold mt-0.5 ${riskColor}`}>{riskLabel}</span>
        </div>

        {/* Sharpe Ratio */}
        <div className="border border-indigo-500/25 bg-indigo-500/10 p-3 flex flex-col justify-between rounded-none">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Sharpe Ratio</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-black font-mono text-indigo-400 tracking-tight mt-1">
            {metrics.sharpe_ratio ? metrics.sharpe_ratio.toFixed(2) : "N/A"}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Risk-adjusted metric</span>
        </div>

        {/* Dividend Yield */}
        <div className="border border-amber-500/25 bg-amber-500/10 p-3 flex flex-col justify-between rounded-none">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Dividend Yield</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-black font-mono text-amber-400 tracking-tight mt-1">
            {formatPct(metrics.dividend_yield)}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Annual cash flow rate</span>
        </div>
      </div>

      {/* Tabs: Allocation vs Projections vs Milestones */}
      <Tabs defaultValue="allocation" className="w-full">
        <TabsList className="bg-background/60 border border-border/50 p-1 rounded-none w-full grid grid-cols-2 sm:grid-cols-3">
          <TabsTrigger
            value="allocation"
            className="rounded-none text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <TableIcon className="w-3.5 h-3.5" />
            Holdings & Shares
          </TabsTrigger>
          <TabsTrigger
            value="projections"
            className="rounded-none text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <ChartIcon className="w-3.5 h-3.5" />
            30-Yr Trajectory
          </TabsTrigger>
          {metrics.requirements_to_target && Object.keys(metrics.requirements_to_target).length > 0 && (
            <TabsTrigger
              value="milestones"
              className="rounded-none text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 col-span-2 sm:col-span-1"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Target Schedule
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: Allocation Table */}
        <TabsContent value="allocation" className="mt-3 focus-visible:outline-none">
          <div className="border border-border/50 bg-card/40 rounded-none overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Target Allocation for {formatCurrency(totalBudgetNum)}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {sortedTickers.length} Assets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 px-4">Ticker</th>
                    <th className="py-2.5 px-4 w-40">Weight</th>
                    <th className="py-2.5 px-4 text-right">Shares</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTickers.map((ticker) => {
                    const weight = optimizationResult.weights[ticker] ?? 0;
                    const price = optimizationResult.prices?.[ticker] ?? 0;
                    const shares = optimizationResult.shares?.[ticker] ?? 0;
                    const dollars = weight * totalBudgetNum;

                    return (
                      <tr key={ticker} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-black font-mono text-sm text-primary">
                          {ticker}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={weight * 100 * 3} className="h-1.5 flex-1 rounded-none bg-muted/30" />
                            <span className="font-mono text-xs font-bold w-12 text-right">
                              {(weight * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                          {shares > 0 ? shares : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                          {price > 0 ? formatCurrency(price) : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(dollars)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Projections Charts */}
        <TabsContent value="projections" className="mt-3 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wealth Growth Chart */}
            <div className="border border-border/50 p-4 bg-card/40 rounded-none flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Portfolio Capital Growth
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ${monthlyContribution}/mo
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={optimizationResult.projections}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="year" stroke="#888" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                    <YAxis
                      stroke="#888"
                      fontSize={10}
                      tickFormatter={(v) => (v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        borderRadius: "0px",
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value)), "Portfolio Value"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annual Income Chart */}
            <div className="border border-border/50 p-4 bg-card/40 rounded-none flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Annual Dividend Cash Flow
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Compounding Yield
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={optimizationResult.projections}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="year" stroke="#888" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                    <YAxis
                      stroke="#888"
                      fontSize={10}
                      tickFormatter={(v) => `$${v.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderColor: "#27272a",
                        color: "#fff",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        borderRadius: "0px",
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value)), "Annual Cash Flow"]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Milestones Schedule */}
        {metrics.requirements_to_target && Object.keys(metrics.requirements_to_target).length > 0 && (
          <TabsContent value="milestones" className="mt-3 focus-visible:outline-none">
            <div className="border border-border/50 p-4 bg-card/40 rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Monthly Contribution Needed to Reach Target Income
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Target Schedule</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(metrics.requirements_to_target).map(([year, req]) => (
                  <div key={year} className="border border-border/40 bg-background/50 p-2.5 text-center rounded-none">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-1">
                      Year {year}
                    </span>
                    <span className={`font-mono text-xs font-bold ${req === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {req === 0 ? "Fully Funded" : `$${req.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground italic">
                * "Fully Funded" indicates that compounding growth alone will hit your goal without requiring additional monthly deposits.
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1 rounded-none border-border/50 font-bold text-xs uppercase tracking-widest h-11"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Adjust Parameters
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2 h-11 shadow-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Portfolio...
            </>
          ) : (
            <>
              <BookmarkCheck className="w-4 h-4" />
              Save "{portfolioName}" to My Portfolios
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
