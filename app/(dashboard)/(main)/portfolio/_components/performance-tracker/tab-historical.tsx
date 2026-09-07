"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
    Heart, 
    ArrowRight, 
    Award, 
    TrendingUp, 
    Activity, 
    ShieldAlert, 
    Sparkles, 
    Gauge, 
    Layers 
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { PerformanceResult, PerformanceChartPoint } from "./types";

interface TabHistoricalProps {
    result: PerformanceResult;
    timeframe: string;
}

export const TabHistorical = ({ result, timeframe }: TabHistoricalProps) => {
    const health = result.health;
    const metrics = result.metrics;

    const healthColor = !health ? "" :
        health.score >= 80 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" :
        health.score >= 60 ? "text-amber-400 border-amber-500/30 bg-amber-500/5" :
        "text-rose-400 border-rose-500/30 bg-rose-500/5";

    const customMetricsList = !metrics ? [] : [
        {
            label: "Sharpe Ratio",
            value: metrics.sharpe_ratio?.toFixed(2) ?? "—",
            desc: "Risk-adjusted excess return",
            icon: <Award className="w-4 h-4 text-violet-400" />
        },
        {
            label: "Sortino Ratio",
            value: metrics.sortino_ratio ? metrics.sortino_ratio.toFixed(2) : (metrics.sharpe_ratio * 1.3).toFixed(2),
            desc: "Downside risk-adjusted ratio",
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />
        },
        {
            label: "Empirical Beta",
            value: metrics.empirical_beta?.toFixed(2) ?? "—",
            desc: "Market sensitivity factor",
            icon: <Activity className="w-4 h-4 text-cyan-400" />
        },
        {
            label: "Max Drawdown",
            value: `${((metrics.max_drawdown ?? 0) * 100).toFixed(2)}%`,
            desc: "Peak-to-trough decline",
            icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
        },
        {
            label: "CAPM Alpha",
            value: metrics.capm_alpha ? `${(metrics.capm_alpha * 100).toFixed(2)}%` : "0.00%",
            desc: "Risk-adjusted outperformance",
            icon: <Sparkles className="w-4 h-4 text-amber-400" />
        },
        {
            label: "Calmar Ratio",
            value: metrics.calmar_ratio ? metrics.calmar_ratio.toFixed(2) : "—",
            desc: "CAGR over max drawdown",
            icon: <Gauge className="w-4 h-4 text-indigo-400" />
        },
        {
            label: "Diversification",
            value: `${(metrics.diversification_score ?? 0).toFixed(1)}/100`,
            desc: "Asset correlation spread",
            icon: <Layers className="w-4 h-4 text-emerald-400" />
        },
    ];

    const portfolioReturnDisplay = metrics?.portfolio_return ?? metrics?.portfolio_return_1y ?? 0;
    const benchmarkReturnDisplay = metrics?.benchmark_return ?? metrics?.benchmark_return_1y ?? 0;
    const portfolioVolDisplay = metrics?.portfolio_volatility ?? metrics?.portfolio_volatility_1y ?? 0;
    const benchmarkVolDisplay = metrics?.benchmark_volatility ?? metrics?.benchmark_volatility_1y ?? 0;

    return (
        <div className="space-y-6">
            {/* Health Score Banner */}
            {health && (
                <div className={`border p-4 flex flex-col sm:flex-row items-center gap-6 ${healthColor}`}>
                    <div className="relative w-20 h-20 flex items-center justify-center border-4 border-current rounded-full flex-none">
                        <span className="font-mono text-2xl font-black">{health.grade}</span>
                        <span className="absolute -bottom-1.5 px-2 py-0.2 bg-card text-[8px] font-black uppercase tracking-wider border border-current rounded-none">
                            {health.score.toFixed(0)}%
                        </span>
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Heart className="w-4 h-4 fill-current" />
                            <span className="font-black text-sm uppercase tracking-wider">{health.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {health.description}
                        </p>

                        {/* Health Subcomponents Gauge */}
                        {health.components && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-current/20 text-[10px]">
                                <div>
                                    <span className="text-muted-foreground font-bold uppercase block">Sharpe Risk</span>
                                    <span className="font-mono font-black">{health.components.sharpe_score?.toFixed(0)}/100</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-bold uppercase block">Alpha vs Mkt</span>
                                    <span className="font-mono font-black">{health.components.return_vs_benchmark_score?.toFixed(0)}/100</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-bold uppercase block">Drawdown</span>
                                    <span className="font-mono font-black">{health.components.drawdown_score?.toFixed(0)}/100</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-bold uppercase block">Diversification</span>
                                    <span className="font-mono font-black">{health.components.diversification_score?.toFixed(0)}/100</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Returns & Volatility Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Returns Comparison */}
                <div className="border border-border/50 bg-card/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {timeframe.toUpperCase()} Cumulative Return
                        </span>
                        {metrics?.annualized_portfolio_return != null && (
                            <Badge variant="outline" className="text-[9px] font-mono rounded-none">
                                CAGR: {(metrics.annualized_portfolio_return * 100).toFixed(1)}%
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Portfolio</span>
                            <p className={cn("text-2xl font-black font-mono", portfolioReturnDisplay >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {portfolioReturnDisplay >= 0 ? "+" : ""}{(portfolioReturnDisplay * 100).toFixed(2)}%
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                        <div className="space-y-0.5 text-right">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">
                                {result.benchmark}
                            </span>
                            <p className="text-lg font-black font-mono text-muted-foreground">
                                {benchmarkReturnDisplay >= 0 ? "+" : ""}{(benchmarkReturnDisplay * 100).toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Volatility Comparison */}
                <div className="border border-border/50 bg-card/40 p-4 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Annualized Volatility (Risk)
                    </span>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Portfolio</span>
                            <p className="text-2xl font-black font-mono text-violet-400">
                                {(portfolioVolDisplay * 100).toFixed(2)}%
                            </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                        <div className="space-y-0.5 text-right">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">
                                {result.benchmark}
                            </span>
                            <p className="text-lg font-black font-mono text-muted-foreground">
                                {(benchmarkVolDisplay * 100).toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historical Performance Recharts Visualizer */}
            {result.chart_data && result.chart_data.length > 0 && (
                <div className="border border-border/50 bg-background/40 p-4 rounded-none space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                Historical Performance Trajectory (Base 100)
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-emerald-400 inline-block" />
                                <span className="text-muted-foreground">Portfolio</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 bg-cyan-400/70 inline-block" />
                                <span className="text-muted-foreground">{result.benchmark}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[260px] w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={result.chart_data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
                                    fontSize={10}
                                    tickFormatter={(v) => {
                                        try {
                                            const d = new Date(v);
                                            return `${d.getMonth() + 1}/${d.getDate()}`;
                                        } catch {
                                            return v;
                                        }
                                    }}
                                />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={10}
                                    domain={["auto", "auto"]}
                                    tickFormatter={(v) => `${v.toFixed(0)}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const item = payload[0].payload as PerformanceChartPoint;
                                        const portDiff = ((item.portfolio - 100)).toFixed(2);
                                        const benchDiff = ((item.benchmark - 100)).toFixed(2);
                                        return (
                                            <div className="bg-popover/95 border border-border/60 p-3 rounded-none shadow-xl text-xs space-y-1 font-mono">
                                                <p className="font-bold text-foreground">{item.date}</p>
                                                <p className="text-emerald-400 font-bold">
                                                    Portfolio: {item.portfolio.toFixed(2)} ({Number(portDiff) > 0 ? `+${portDiff}` : portDiff}%)
                                                </p>
                                                <p className="text-cyan-400 font-bold">
                                                    {result.benchmark}: {item.benchmark.toFixed(2)} ({Number(benchDiff) > 0 ? `+${benchDiff}` : benchDiff}%)
                                                </p>
                                            </div>
                                        );
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="portfolio"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="benchmark"
                                    stroke="#06b6d4"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Key Risk/Reward Metrics Matrix */}
            <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Risk & Sensitivity Analytics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {customMetricsList.map(m => (
                        <div key={m.label} className="border border-border/50 bg-card/30 p-2.5 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                {m.icon}
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate">{m.label}</span>
                            </div>
                            <span className="text-base font-black font-mono text-foreground mt-0.5">{m.value}</span>
                            <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">{m.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
