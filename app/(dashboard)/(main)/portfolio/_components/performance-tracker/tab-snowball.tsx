"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
    TrendingUp,
    Sparkles,
    Loader2,
    Calendar,
    AlertTriangle,
    ShieldCheck,
    Flame,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { YearSnapshot } from "./types";

interface TabSnowballProps {
    startingPrincipal: number;
    setStartingPrincipal: (v: number) => void;
    monthlyContribution: number;
    setMonthlyContribution: (v: number) => void;
    dividendYieldPct: number;
    setDividendYieldPct: (v: number) => void;
    dividendGrowthRatePct: number;
    setDividendGrowthRatePct: (v: number) => void;
    priceGrowthRatePct: number;
    setPriceGrowthRatePct: (v: number) => void;
    years: number;
    setYears: (v: number) => void;
    dripEnabled: boolean;
    setDripEnabled: (v: boolean) => void;
    targetMonthlyIncome: number;
    setTargetMonthlyIncome: (v: number) => void;
    snowballTab: "capital" | "income";
    setSnowballTab: (v: "capital" | "income") => void;
    showSchedule: boolean;
    setShowSchedule: (v: boolean) => void;
    simulation: {
        schedule: YearSnapshot[];
        crossoverYear: number | null;
        finalPortfolioValue: number;
        finalAnnualDividends: number;
        finalMonthlyDividends: number;
        finalYieldOnCost: number;
        totalContributed: number;
        cumulativeDividends: number;
    };
    analyzingAi: boolean;
    aiAnalysis: any;
    onRunAiCoach: () => void;
    setAiAnalysis: (v: any) => void;
}

export const TabSnowball = ({
    startingPrincipal,
    setStartingPrincipal,
    monthlyContribution,
    setMonthlyContribution,
    dividendYieldPct,
    setDividendYieldPct,
    dividendGrowthRatePct,
    setDividendGrowthRatePct,
    priceGrowthRatePct,
    setPriceGrowthRatePct,
    years,
    setYears,
    dripEnabled,
    setDripEnabled,
    targetMonthlyIncome,
    setTargetMonthlyIncome,
    snowballTab,
    setSnowballTab,
    showSchedule,
    setShowSchedule,
    simulation,
    analyzingAi,
    aiAnalysis,
    onRunAiCoach,
    setAiAnalysis,
}: TabSnowballProps) => {
    return (
        <div className="space-y-6">
            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/40 border border-border/50">
                {/* Col 1: Capital Inputs */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Starting Portfolio Principal:</span>
                            <span className="font-mono font-bold text-foreground">
                                ${startingPrincipal.toLocaleString()}
                            </span>
                        </div>
                        <Slider
                            value={[Math.min(1000000, Math.max(1000, startingPrincipal))]}
                            min={1000}
                            max={1000000}
                            step={1000}
                            onValueChange={([v]) => { setStartingPrincipal(v); setAiAnalysis(null); }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Monthly Contribution:</span>
                            <span className="font-mono font-bold text-primary">
                                ${monthlyContribution.toLocaleString()}/mo
                            </span>
                        </div>
                        <Slider
                            value={[monthlyContribution]}
                            min={0}
                            max={10000}
                            step={50}
                            onValueChange={([v]) => { setMonthlyContribution(v); setAiAnalysis(null); }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Compounding Horizon:</span>
                            <span className="font-mono font-bold text-foreground">{years} Years</span>
                        </div>
                        <Slider
                            value={[years]}
                            min={5}
                            max={30}
                            step={1}
                            onValueChange={([v]) => { setYears(v); setAiAnalysis(null); }}
                        />
                    </div>
                </div>

                {/* Col 2: Return Rates */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Portfolio Dividend Yield:</span>
                            <span className="font-mono font-bold text-emerald-400">{dividendYieldPct.toFixed(2)}%</span>
                        </div>
                        <Slider
                            value={[Math.min(35.0, Math.max(0.0, dividendYieldPct))]}
                            min={0.0}
                            max={35.0}
                            step={0.05}
                            onValueChange={([v]) => {
                                setDividendYieldPct(v);
                                if (v > 10 && priceGrowthRatePct > 0) {
                                    setPriceGrowthRatePct(-6.0);
                                    setDividendGrowthRatePct(0);
                                }
                                setAiAnalysis(null);
                            }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Dividend Growth Rate (CAGR):</span>
                            <span className={cn("font-mono font-bold", dividendGrowthRatePct < 0 ? "text-amber-400" : "text-foreground")}>
                                {dividendGrowthRatePct > 0 ? `+${dividendGrowthRatePct.toFixed(1)}%` : `${dividendGrowthRatePct.toFixed(1)}%`}
                            </span>
                        </div>
                        <Slider
                            value={[dividendGrowthRatePct]}
                            min={-10.0}
                            max={20.0}
                            step={0.5}
                            onValueChange={([v]) => { setDividendGrowthRatePct(v); setAiAnalysis(null); }}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Expected Price Growth:</span>
                            <span className={cn("font-mono font-bold", priceGrowthRatePct < 0 ? "text-amber-400" : "text-foreground")}>
                                {priceGrowthRatePct > 0 ? `+${priceGrowthRatePct.toFixed(1)}%` : `${priceGrowthRatePct.toFixed(1)}%`}
                            </span>
                        </div>
                        <Slider
                            value={[priceGrowthRatePct]}
                            min={-15.0}
                            max={15.0}
                            step={0.5}
                            onValueChange={([v]) => { setPriceGrowthRatePct(v); setAiAnalysis(null); }}
                        />
                    </div>

                    {/* Implied Total Return Bar */}
                    <div className="pt-0.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-semibold">Implied Total Return:</span>
                        <span className={cn("font-mono font-bold", (dividendYieldPct + priceGrowthRatePct) > 20 ? "text-rose-400" : "text-emerald-400")}>
                            {(dividendYieldPct + priceGrowthRatePct) > 0 ? `+${(dividendYieldPct + priceGrowthRatePct).toFixed(1)}%` : `${(dividendYieldPct + priceGrowthRatePct).toFixed(1)}%`} / yr
                        </span>
                    </div>
                </div>

                {/* Col 3: DRIP & Target Goal */}
                <div className="space-y-3.5 flex flex-col justify-between bg-muted/10 p-3 rounded-none border border-border/40">
                    {/* DRIP Switch */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-foreground block">DRIP Reinvestment</span>
                            <span className="text-[10px] text-muted-foreground">
                                Auto-reinvest dividend cashflow
                            </span>
                        </div>
                        <Switch
                            checked={dripEnabled}
                            onCheckedChange={(c) => { setDripEnabled(c); setAiAnalysis(null); }}
                        />
                    </div>

                    {/* Target Income */}
                    <div>
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-muted-foreground">Target Monthly Income:</span>
                            <span className="font-mono font-black text-amber-400">
                                ${targetMonthlyIncome.toLocaleString()}/mo
                            </span>
                        </div>
                        <Slider
                            value={[targetMonthlyIncome]}
                            min={250}
                            max={25000}
                            step={250}
                            onValueChange={([v]) => { setTargetMonthlyIncome(v); setAiAnalysis(null); }}
                        />
                    </div>

                    {/* AI Coaching Button */}
                    <Button
                        size="sm"
                        onClick={onRunAiCoach}
                        disabled={analyzingAi}
                        className="w-full h-8 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 rounded-none"
                    >
                        {analyzingAi ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Analyzing Strategy...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Portfolio AI Strategy Coaching</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* High-Yield Alert Banner */}
            {dividendYieldPct > 10 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <span className="font-bold text-amber-300">High-Yield Option Strategy (Yield &gt; 10%):</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                                Covered-call ETFs (FEPI, JEPI, CONY) trade upside potential for premium payouts, commonly resulting in NAV erosion (-5% to -10%/yr). Model modest negative price growth for realistic multi-year compounding.
                            </p>
                        </div>
                    </div>
                    {priceGrowthRatePct >= 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setPriceGrowthRatePct(-6.0);
                                setDividendGrowthRatePct(0.0);
                            }}
                            className="shrink-0 h-7 text-[10px] px-2.5 border-amber-500/40 hover:bg-amber-500/20 text-amber-300 font-bold rounded-none"
                        >
                            Apply Realistic NAV Decay (-6%)
                        </Button>
                    )}
                </div>
            )}

            {/* Live Scorecard KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Value */}
                <div className="p-3.5 bg-background/50 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Projected Portfolio Value
                    </span>
                    <span className="text-xl font-black font-mono text-foreground tracking-tight">
                        ${simulation.finalPortfolioValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                        Invested: ${simulation.totalContributed.toLocaleString()}
                    </span>
                </div>

                {/* Monthly Income */}
                <div className="p-3.5 bg-background/50 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Monthly Passive Income
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                        ${simulation.finalMonthlyDividends.toLocaleString()}/mo
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                        Annual: ${simulation.finalAnnualDividends.toLocaleString()}
                    </span>
                </div>

                {/* Yield on Cost */}
                <div className="p-3.5 bg-background/50 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Effective Yield on Cost
                    </span>
                    <span className="text-xl font-black font-mono text-primary tracking-tight">
                        {simulation.finalYieldOnCost}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                        Annual Div ÷ Total Cash Saved
                    </span>
                </div>

                {/* Crossover Milestone */}
                <div className="p-3.5 bg-background/50 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        The Crossover Point
                    </span>
                    {simulation.crossoverYear ? (
                        <>
                            <span className="text-xl font-black font-mono text-amber-400 tracking-tight flex items-center gap-1">
                                <Flame className="w-5 h-5 text-amber-500" />
                                Year {simulation.crossoverYear}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                                Dividends exceed out-of-pocket savings!
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-bold text-muted-foreground block pt-1">
                                Horizon Too Short
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                                Extend time or savings rate
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* AI Coaching Assessment (if triggered) */}
            {aiAnalysis && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-500/10 via-background/40 to-background border border-emerald-500/30 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                Portfolio AI Financial Independence Assessment
                            </span>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 rounded-none">
                            {aiAnalysis.status}
                        </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {aiAnalysis.executiveSummary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-3 bg-background/50 border border-border/40 space-y-1">
                            <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                                Crossover & DRIP Power
                            </span>
                            <p className="text-muted-foreground leading-relaxed">
                                {aiAnalysis.crossoverMilestoneInsight}
                            </p>
                        </div>

                        <div className="p-3 bg-background/50 border border-border/40 space-y-1">
                            <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                                Acceleration Levers
                            </span>
                            <ul className="list-disc pl-3 text-muted-foreground space-y-1 marker:text-amber-400">
                                {aiAnalysis.accelerationLevers?.map((lev: string, i: number) => (
                                    <li key={i}>{lev}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Compounding Trajectory Visualizer */}
            <div className="bg-background/40 p-4 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                            Compounding Trajectory ({years} Years)
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-muted/40 p-0.5 border border-border/40 text-xs">
                        <button
                            onClick={() => setSnowballTab("capital")}
                            className={cn(
                                "px-3 py-1 font-bold transition-all text-xs",
                                snowballTab === "capital"
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Capital Growth ($)
                        </button>
                        <button
                            onClick={() => setSnowballTab("income")}
                            className={cn(
                                "px-3 py-1 font-bold transition-all text-xs",
                                snowballTab === "income"
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Monthly Income ($)
                        </button>
                    </div>
                </div>

                <div className="h-[260px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        {snowballTab === "capital" ? (
                            <AreaChart
                                data={simulation.schedule}
                                margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                            >
                                <defs>
                                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="year" stroke="#71717a" fontSize={11} tickFormatter={(v) => `Yr ${v}`} />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={11}
                                    tickFormatter={(v) => {
                                        if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                                        if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                                        return `$${v}`;
                                    }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const item = payload[0].payload as YearSnapshot;
                                        return (
                                            <div className="bg-popover/95 border border-border/60 p-3 rounded-none shadow-xl text-xs space-y-1 font-mono">
                                                <p className="font-bold text-foreground">Year {item.year}</p>
                                                <p className="text-emerald-400 font-bold">
                                                    Total Value: ${item.portfolioValue.toLocaleString()}
                                                </p>
                                                <p className="text-indigo-400">
                                                    Contributed: ${item.totalContributed.toLocaleString()}
                                                </p>
                                                <p className="text-muted-foreground">
                                                    Reinvested Gains: ${item.reinvestedGains.toLocaleString()}
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="portfolioValue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#valGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalContributed"
                                    stroke="#6366f1"
                                    strokeWidth={1.5}
                                    fill="url(#contribGrad)"
                                />
                            </AreaChart>
                        ) : (
                            <BarChart
                                data={simulation.schedule}
                                margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="year" stroke="#71717a" fontSize={11} tickFormatter={(v) => `Yr ${v}`} />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={11}
                                    tickFormatter={(v) => {
                                        if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                                        if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                                        return `$${v}`;
                                    }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const item = payload[0].payload as YearSnapshot;
                                        return (
                                            <div className="bg-popover/95 border border-border/60 p-3 rounded-none shadow-xl text-xs space-y-1 font-mono">
                                                <p className="font-bold text-foreground">Year {item.year}</p>
                                                <p className="text-emerald-400 font-bold">
                                                    Monthly Income: ${item.monthlyDividends.toLocaleString()}/mo
                                                </p>
                                                <p className="text-muted-foreground">
                                                    Annual Dividends: ${item.annualDividends.toLocaleString()}/yr
                                                </p>
                                                <p className="text-primary">
                                                    Yield on Cost: {item.yieldOnCostPct}%
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <ReferenceLine
                                    y={targetMonthlyIncome}
                                    stroke="#f59e0b"
                                    strokeDasharray="4 4"
                                    label={{
                                        value: `Target Goal: $${targetMonthlyIncome.toLocaleString()}/mo`,
                                        fill: "#f59e0b",
                                        fontSize: 10,
                                        position: "top",
                                    }}
                                />
                                <Bar
                                    dataKey="monthlyDividends"
                                    fill="#10b981"
                                    radius={[2, 2, 0, 0]}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Collapsible Year-by-Year Amortization Schedule */}
            <div className="border border-border/50 bg-background/30">
                <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="w-full flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-muted/20"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Full Year-by-Year Amortization Schedule</span>
                    </div>
                    <span className="text-[10px] font-mono text-primary">
                        {showSchedule ? "Hide Table ▲" : "View Full Schedule ▼"}
                    </span>
                </button>

                {showSchedule && (
                    <div className="overflow-x-auto max-h-60 custom-scrollbar divide-y divide-border/20 text-xs">
                        <table className="w-full text-left font-mono">
                            <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                                <tr>
                                    <th className="py-2 px-3">Year</th>
                                    <th className="py-2 px-3">Portfolio Value</th>
                                    <th className="py-2 px-3">Monthly Div</th>
                                    <th className="py-2 px-3">Annual Div</th>
                                    <th className="py-2 px-3">Yield on Cost</th>
                                    <th className="py-2 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {simulation.schedule.map((row) => (
                                    <tr
                                        key={row.year}
                                        className={cn(
                                            "hover:bg-muted/20 transition-colors",
                                            row.isCrossover && "bg-amber-500/5"
                                        )}
                                    >
                                        <td className="py-1.5 px-3 font-bold">Yr {row.year}</td>
                                        <td className="py-1.5 px-3">${row.portfolioValue.toLocaleString()}</td>
                                        <td className="py-1.5 px-3 text-emerald-400 font-bold">
                                            ${row.monthlyDividends.toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-3">${row.annualDividends.toLocaleString()}</td>
                                        <td className="py-1.5 px-3 text-primary">{row.yieldOnCostPct}%</td>
                                        <td className="py-1.5 px-3 text-[10px]">
                                            {row.isCrossover ? (
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30 rounded-none">
                                                    Crossover 🔥
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground/50">Accumulating</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
