"use client";

import { motion } from "framer-motion";
import { TrendingUp, Activity, Target, ChevronLeft, Loader2, BookmarkCheck, Calendar, DollarSign, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ManualCalculationResult {
    success: boolean;
    initial_portfolio_value: number;
    current_monthly_income: number;
    portfolio_weighted_return: number;
    portfolio_weighted_yield: number;
    prices: Record<string, number>;
    shares: Record<string, number>;
    time_to_target: {
        years: number;
        months: number;
        total_years: number;
        formatted: string;
    } | null;
    milestones: Record<string, {
        portfolio_value: number;
        monthly_income: number;
    }>;
}

interface ManualResultsProps {
    result: ManualCalculationResult;
    monthlyContribution: number;
    targetMonthlyIncome: number;
    onReset: () => void;
    onSave: () => void;
    isSaving: boolean;
}

const ManualResults = ({ result, monthlyContribution, targetMonthlyIncome, onReset, onSave, isSaving }: ManualResultsProps) => {
    // console.log(result);
    // Construct charts projection data from milestones
    const chartData = Object.entries(result.milestones || {})
        .map(([year, data]) => ({
            year: parseInt(year),
            value: data.portfolio_value,
            income: data.monthly_income,
        }))
        .sort((a, b) => a.year - b.year);

    // Calculate total return and volatility metrics (defaulting or calculating base assets)
    const metrics = [
        {
            icon: <TrendingUp className="w-4 h-4" />,
            label: "Weighted Return",
            value: `${result.portfolio_weighted_return.toFixed(2)}%`,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20"
        },
        {
            icon: <Activity className="w-4 h-4" />,
            label: "Dividend Yield",
            value: `${result.portfolio_weighted_yield.toFixed(2)}%`,
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20"
        },
        {
            icon: <DollarSign className="w-4 h-4" />,
            label: "Mo. Dividend Income",
            value: `$${result.current_monthly_income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20"
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            {/* Summary Banner */}
            <div className="border border-border/50 bg-card/45 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Initial Portfolio Value</span>
                    <h2 className="text-3xl font-black text-primary font-mono mt-0.5">
                        ${result.initial_portfolio_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                </div>
                {result.time_to_target && (
                    <div className="flex items-center gap-3 border border-primary/20 bg-primary/5 px-4 py-2 rounded-none">
                        <Award className="w-5 h-5 text-primary flex-none" />
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">Time to target (${targetMonthlyIncome}/mo)</span>
                            <p className="text-sm font-black italic text-foreground tracking-tight">{result.time_to_target.formatted}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
                {metrics.map(m => (
                    <div key={m.label} className={`border ${m.bg} p-3 flex flex-col gap-1`}>
                        <div className={`flex items-center gap-1.5 ${m.color}`}>
                            {m.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </div>
                        <span className={`text-xl font-black font-mono ${m.color}`}>{m.value}</span>
                    </div>
                ))}
            </div>

            {/* Allocation table */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Holdings Allocation Breakdown</p>
                <div className="border border-border/50 overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-muted/20 border-b border-border/40">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-16 flex-none">Ticker</span>
                        <div className="flex-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-14 text-right flex-none">Weight</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-16 text-right flex-none">Shares</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 text-right flex-none">Price</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 text-right flex-none">Value</span>
                    </div>
                    {Object.entries(result.shares)
                        .map(([ticker, sharesCount]) => {
                            const price = result.prices[ticker] ?? 0;
                            const value = sharesCount * price;
                            const weight = result.initial_portfolio_value > 0 ? value / result.initial_portfolio_value : 0;
                            return { ticker, sharesCount, price, value, weight };
                        })
                        .sort((a, b) => b.weight - a.weight)
                        .map(({ ticker, sharesCount, price, value, weight }) => (
                            <div key={ticker} className="flex items-center gap-4 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                                <span className="font-black text-base italic text-primary w-16 flex-none">{ticker}</span>
                                <div className="flex-1 relative h-1.5 bg-muted/30 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(weight * 100).toFixed(1)}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="absolute left-0 top-0 h-full bg-primary"
                                    />
                                </div>
                                <span className="font-mono font-bold text-sm text-foreground w-14 text-right flex-none">
                                    {(weight * 100).toFixed(1)}%
                                </span>
                                <span className="font-mono text-sm font-bold text-foreground w-16 text-right flex-none">
                                    {sharesCount}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground w-20 text-right flex-none">
                                    ${price.toFixed(2)}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground w-20 text-right flex-none">
                                    ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Projections Chart */}
            {chartData.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        30-Year Milestones Projections (Contribution: ${monthlyContribution}/mo)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-border/50 p-4 bg-card/50">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">Portfolio Growth</p>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="year" stroke="#4927F5" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                                        <YAxis stroke="#4927F5" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#E2DC32", color: "#000", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontFamily: "monospace" }}
                                            formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Value"]}
                                            labelFormatter={(label) => `Year ${label}`}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={true} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="border border-border/50 p-4 bg-card/50">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">Monthly Income Growth</p>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="year" stroke="#12AA59" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                                        <YAxis stroke="#12AA59" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#C4C4C4", color: "#000", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontFamily: "monospace" }}
                                            formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Mo. Income"]}
                                            labelFormatter={(label) => `Year ${label}`}
                                        />
                                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={true} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onReset}
                    disabled={isSaving}
                    className="flex-1 rounded-none border-border/50 font-bold text-xs uppercase tracking-widest hover:bg-muted/30"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Adjust Shares
                </Button>
                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2"
                >
                    {isSaving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : (
                        <><BookmarkCheck className="w-3.5 h-3.5" /> Save to Portfolio</>
                    )}
                </Button>
            </div>
        </motion.div>
    );
};

export default ManualResults;
