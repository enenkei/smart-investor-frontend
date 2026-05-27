"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Activity, 
    ShieldAlert, 
    TrendingUp, 
    Heart, 
    ArrowRight, 
    Award, 
    Gauge, 
    DollarSign,
    Percent
} from "lucide-react";
import { motion } from "framer-motion";

export interface PerformanceResult {
    success: boolean;
    benchmark: string;
    health: {
        score: number;
        grade: string;
        status: string;
        description: string;
    };
    metrics: {
        portfolio_return_1y: number;
        benchmark_return_1y: number;
        portfolio_volatility_1y: number;
        benchmark_volatility_1y: number;
        empirical_beta: number;
        capm_alpha: number;
        sharpe_ratio: number;
        max_drawdown: number;
        diversification_score: number;
    };
    current_prices: Record<string, number>;
}

interface PerformanceTrackerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    result: PerformanceResult | null;
    portfolioName: string;
}

const PerformanceTrackerDialog = ({ open, onOpenChange, result, portfolioName }: PerformanceTrackerDialogProps) => {
    if (!result) return null;

    const { health, metrics, current_prices } = result;

    const healthColor = 
        health.score >= 80 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" :
        health.score >= 60 ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
        "text-rose-400 border-rose-500/20 bg-rose-500/5";


    const customMetrics = [
        {
            label: "Sharpe Ratio",
            value: metrics.sharpe_ratio.toFixed(2),
            desc: "Risk-adjusted return ratio",
            icon: <Award className="w-4 h-4 text-violet-400" />
        },
        {
            label: "Max Drawdown",
            value: `${(metrics.max_drawdown * 100).toFixed(2)}%`,
            desc: "Peak-to-trough decline",
            icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
        },
        {
            label: "Empirical Beta",
            value: metrics.empirical_beta.toFixed(2),
            desc: "Market sensitivity factor",
            icon: <Activity className="w-4 h-4 text-cyan-400" />
        },
        {
            label: "Diversification",
            value: `${metrics.diversification_score.toFixed(1)}/100`,
            desc: "Allocation balance index",
            icon: <Gauge className="w-4 h-4 text-emerald-400" />
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Performance Analysis</span>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-foreground mt-0.5">
                                {portfolioName || "My Portfolio"}
                            </DialogTitle>
                        </div>
                        <Badge className="rounded-none bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-2 py-0.5">
                            VS {result.benchmark}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Health Status Dashboard */}
                    <div className={`border p-4 flex items-center gap-6 ${healthColor}`}>
                        <div className="relative w-20 h-20 flex items-center justify-center border-4 border-current rounded-full flex-none">
                            <span className="font-mono text-2xl font-black">{health.grade}</span>
                            <span className="absolute -bottom-1.5 px-1.5 py-0.2 bg-card text-[8px] font-black uppercase tracking-wider border border-current rounded-none">
                                {health.score.toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 fill-current" />
                                <span className="font-black text-sm uppercase tracking-wider">{health.status}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {health.description}
                            </p>
                        </div>
                    </div>

                    {/* Return vs Volatility Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Returns Comparison */}
                        <div className="border border-border/50 bg-card/40 p-4 space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">1-Year Annualized Return</span>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Portfolio</span>
                                    <p className="text-2xl font-black font-mono text-emerald-400">
                                        +{(metrics.portfolio_return_1y * 100).toFixed(2)}%
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Benchmark</span>
                                    <p className="text-lg font-black font-mono text-muted-foreground">
                                        +{(metrics.benchmark_return_1y * 100).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Volatility Comparison */}
                        <div className="border border-border/50 bg-card/40 p-4 space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Portfolio Volatility (Risk)</span>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Portfolio</span>
                                    <p className="text-2xl font-black font-mono text-violet-400">
                                        {(metrics.portfolio_volatility_1y * 100).toFixed(2)}%
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                                <div className="space-y-0.5 text-right">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Benchmark</span>
                                    <p className="text-lg font-black font-mono text-muted-foreground">
                                        {(metrics.benchmark_volatility_1y * 100).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Risk/Reward Metrics */}
                    <div className="grid grid-cols-4 gap-3">
                        {customMetrics.map(m => (
                            <div key={m.label} className="border border-border/50 bg-card/25 p-3 flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    {m.icon}
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
                                </div>
                                <span className="text-lg font-black font-mono text-foreground">{m.value}</span>
                                <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider leading-none">{m.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* Asset Live Current Prices */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Current Live Prices</span>
                        <div className="border border-border/50 overflow-hidden bg-card/10">
                            <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-muted/20 border-b border-border/40">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Symbol</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Beta</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Live Price</span>
                            </div>
                            <div className="divide-y divide-border/30 max-h-36 overflow-y-auto custom-scrollbar">
                                {Object.entries(current_prices).map(([symbol, price]) => (
                                    <div key={symbol} className="grid grid-cols-3 gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm italic text-primary">{symbol}</span>
                                        </div>
                                        <span className="text-right font-mono text-xs text-muted-foreground">—</span>
                                        <span className="text-right font-mono text-xs font-bold text-foreground">
                                            ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border/50 bg-muted/5 flex justify-end">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="rounded-none bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-xs tracking-widest h-9 px-6"
                    >
                        Close Diagnostics
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PerformanceTrackerDialog;
