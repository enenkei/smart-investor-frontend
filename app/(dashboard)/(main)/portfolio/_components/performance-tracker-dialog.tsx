"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Activity, 
    ShieldAlert, 
    TrendingUp, 
    Heart, 
    ArrowRight, 
    Award, 
    Gauge, 
    DollarSign,
    Percent,
    Snowflake,
    Sparkles,
    Loader2,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Flame,
    Layers,
    RefreshCw,
    Sliders,
    ChevronDown,
    ChevronUp,
    BarChart3,
    PieChart,
    Target
} from "lucide-react";
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { getPortfolioCandidates, savePerformanceResultToPortfolio } from "@/lib/actions/assets";
import { analyzeDividendSnowball } from "@/controllers/ai-controller";

export interface PerformanceChartPoint {
    date: string;
    portfolio: number;
    benchmark: number;
}

export interface AssetAttribution {
    symbol: string;
    shares: number;
    start_price: number;
    current_price: number;
    current_value: number;
    weight: number;
    return: number;
    contribution: number;
}

export interface PerformanceResult {
    success: boolean;
    benchmark: string;
    timeframe?: string;
    health: {
        score: number;
        grade: string;
        status: string;
        description: string;
        components?: {
            sharpe_score?: number;
            return_vs_benchmark_score?: number;
            drawdown_score?: number;
            diversification_score?: number;
        };
    };
    metrics: {
        portfolio_return?: number;
        benchmark_return?: number;
        excess_return?: number;
        annualized_portfolio_return?: number;
        annualized_benchmark_return?: number;
        portfolio_return_1y: number;
        benchmark_return_1y: number;
        portfolio_volatility?: number;
        benchmark_volatility?: number;
        portfolio_volatility_1y: number;
        benchmark_volatility_1y: number;
        downside_volatility?: number;
        empirical_beta: number;
        capm_alpha: number;
        sharpe_ratio: number;
        sortino_ratio?: number;
        calmar_ratio?: number;
        max_drawdown: number;
        diversification_score: number;
    };
    chart_data?: PerformanceChartPoint[];
    asset_attribution?: AssetAttribution[];
    current_prices: Record<string, number>;
}

export interface YearSnapshot {
    year: number;
    portfolioValue: number;
    totalContributed: number;
    annualDividends: number;
    monthlyDividends: number;
    yieldOnCostPct: number;
    cumulativeDividends: number;
    reinvestedGains: number;
    isCrossover: boolean;
}

interface PerformanceTrackerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolioId: number;
    portfolioName: string;
    initialResult?: PerformanceResult | null;
    onResultUpdated?: (result: PerformanceResult) => void;
}

const BENCHMARK_OPTIONS = [
    { value: "^GSPC", label: "S&P 500", desc: "US Large Cap blend" },
    { value: "^NDX", label: "Nasdaq 100", desc: "Tech & Growth heavy" },
    { value: "^DJI", label: "Dow Jones", desc: "US Blue Chip Value" },
    { value: "^RUT", label: "Russell 2000", desc: "US Small Cap Equities" },
    { value: "SCHD", label: "SCHD Dividend", desc: "High-Quality Dividend Equity" },
];

const TIMEFRAME_OPTIONS = [
    { value: "1mo", label: "1M" },
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "3y", label: "3Y" },
    { value: "5y", label: "5Y" },
];

const PerformanceTrackerDialog = ({ 
    open, 
    onOpenChange, 
    portfolioId,
    portfolioName,
    initialResult,
    onResultUpdated 
}: PerformanceTrackerDialogProps) => {
    const { userAssets, fetchUserPortfolios } = usePortfolioStore();

    // Active Tab state
    const [activeMainTab, setActiveMainTab] = useState<"historical" | "snowball" | "attribution">("historical");

    // Performance Diagnostics Parameters
    const [benchmark, setBenchmark] = useState<string>("^GSPC");
    const [customBenchmark, setCustomBenchmark] = useState<string>("");
    const [timeframe, setTimeframe] = useState<string>("1y");
    const [riskFreeRate, setRiskFreeRate] = useState<string>("4.5"); // percentage
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [result, setResult] = useState<PerformanceResult | null>(initialResult || null);

    // Snowball Simulator Parameters
    const [startingPrincipal, setStartingPrincipal] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [dividendYieldPct, setDividendYieldPct] = useState<number>(3.5);
    const [dividendGrowthRatePct, setDividendGrowthRatePct] = useState<number>(6.5);
    const [priceGrowthRatePct, setPriceGrowthRatePct] = useState<number>(5.0);
    const [years, setYears] = useState<number>(20);
    const [dripEnabled, setDripEnabled] = useState<boolean>(true);
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState<number>(2000);
    const [snowballTab, setSnowballTab] = useState<"capital" | "income">("capital");
    const [showSchedule, setShowSchedule] = useState<boolean>(false);

    // AI Coaching State
    const [analyzingAi, setAnalyzingAi] = useState<boolean>(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    // Synchronize initial result
    useEffect(() => {
        if (initialResult) {
            setResult(initialResult);
            if (initialResult.benchmark) {
                const isPreset = BENCHMARK_OPTIONS.some(b => b.value === initialResult.benchmark);
                if (isPreset) {
                    setBenchmark(initialResult.benchmark);
                } else {
                    setCustomBenchmark(initialResult.benchmark);
                }
            }
            if (initialResult.timeframe) {
                setTimeframe(initialResult.timeframe);
            }
        }
    }, [initialResult]);

    // Calculate performance diagnostics request
    const handleRunDiagnostics = useCallback(async (
        overrideBenchmark?: string, 
        overrideTimeframe?: string
    ) => {
        if (!portfolioId) return;

        const targetBenchmark = overrideBenchmark || (customBenchmark.trim() ? customBenchmark.trim().toUpperCase() : benchmark);
        const targetTimeframe = overrideTimeframe || timeframe;

        setIsCalculating(true);
        try {
            const assetsInPortfolio = userAssets.filter(a => a.portfolio_id === portfolioId);
            if (assetsInPortfolio.length === 0) {
                toast.error("The selected portfolio has no assets.");
                setIsCalculating(false);
                return;
            }

            const tickers = assetsInPortfolio.map(a => a.symbol);
            const candidatesData = await getPortfolioCandidates(tickers);
            const sharesMap = new Map(assetsInPortfolio.map(a => [a.symbol.toUpperCase(), a.shares ?? 0]));

            const formattedCandidates = candidatesData.map(c => ({
                symbol: c.symbol,
                total_return: c.total_return,
                beta: c.beta,
                asset_type: c.asset_type,
                dividend_yield: c.dividend_yield
            }));

            const shares = formattedCandidates.map(c => sharesMap.get(c.symbol.toUpperCase()) ?? 0);
            const rfrNumber = (parseFloat(riskFreeRate) || 4.5) / 100;
            const sampleInterval = (targetTimeframe === "3y" || targetTimeframe === "5y") ? "1wk" : "1d";

            const res = await fetch("/api/portfolio/track-performance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidates: formattedCandidates,
                    shares: shares,
                    benchmark: targetBenchmark,
                    timeframe: targetTimeframe,
                    risk_free_rate: rfrNumber,
                    include_chart_data: true,
                    chart_sample_interval: sampleInterval
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            if (data.success) {
                setResult(data);
                if (onResultUpdated) onResultUpdated(data);

                try {
                    await savePerformanceResultToPortfolio(portfolioId, data);
                    await fetchUserPortfolios();
                    toast.success(`Diagnostics refreshed against ${targetBenchmark} (${targetTimeframe.toUpperCase()})`);
                } catch (dbErr: any) {
                    console.error("Failed to save performance data to database:", dbErr);
                }
            } else {
                toast.error(data.error || "Performance tracking failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to track performance");
        } finally {
            setIsCalculating(false);
        }
    }, [portfolioId, benchmark, customBenchmark, timeframe, riskFreeRate, userAssets, onResultUpdated, fetchUserPortfolios]);

    // Auto-calculate if dialog opens without result
    useEffect(() => {
        if (open && !result && !isCalculating && portfolioId) {
            handleRunDiagnostics();
        }
    }, [open, result, isCalculating, portfolioId, handleRunDiagnostics]);

    // Seed Snowball Parameters from Portfolio Results
    useEffect(() => {
        if (!result) return;

        // 1. Calculate Portfolio Total Current Value
        let computedTotalValue = 0;
        if (result.asset_attribution && result.asset_attribution.length > 0) {
            computedTotalValue = result.asset_attribution.reduce((acc, a) => acc + (a.current_value || 0), 0);
        } else if (result.current_prices) {
            const assetsInPortfolio = userAssets.filter(a => a.portfolio_id === portfolioId);
            computedTotalValue = assetsInPortfolio.reduce((acc, a) => {
                const price = result.current_prices[a.symbol.toUpperCase()] || 0;
                return acc + (a.shares ?? 0) * price;
            }, 0);
        }

        if (computedTotalValue > 0) {
            setStartingPrincipal(Math.round(computedTotalValue));
        }

        // 2. Derive Weighted Dividend Yield from holdings
        const assetsInPortfolio = userAssets.filter(a => a.portfolio_id === portfolioId);
        if (computedTotalValue > 0 && assetsInPortfolio.length > 0) {
            getPortfolioCandidates(assetsInPortfolio.map(a => a.symbol)).then(candidatesData => {
                let totalAnnualDiv = 0;
                candidatesData.forEach(c => {
                    const asset = assetsInPortfolio.find(a => a.symbol.toUpperCase() === c.symbol.toUpperCase());
                    const shares = asset?.shares ?? 0;
                    const price = result.current_prices[c.symbol.toUpperCase()] || 0;
                    const val = shares * price;
                    const rawYield = c.dividend_yield || 0;
                    const decimalYield = rawYield > 1 ? rawYield / 100 : rawYield;
                    totalAnnualDiv += val * decimalYield;
                });

                if (computedTotalValue > 0 && totalAnnualDiv > 0) {
                    const weightedY = (totalAnnualDiv / computedTotalValue) * 100;
                    setDividendYieldPct(Number(weightedY.toFixed(2)));
                }
            }).catch(e => console.error(e));
        }

        // 3. Set Price Growth expectation from annualized return if available
        const annReturn = result.metrics.annualized_portfolio_return ?? result.metrics.portfolio_return_1y;
        if (annReturn && typeof annReturn === "number") {
            const expGrowth = Math.max(-5, (annReturn * 100) - dividendYieldPct);
            setPriceGrowthRatePct(Number(expGrowth.toFixed(1)));
        }
    }, [result, portfolioId, userAssets, dividendYieldPct]);

    // Benchmark selection handler
    const handleSelectBenchmark = (b: string) => {
        setBenchmark(b);
        setCustomBenchmark("");
        handleRunDiagnostics(b, timeframe);
    };

    // Timeframe selection handler
    const handleSelectTimeframe = (tf: string) => {
        setTimeframe(tf);
        handleRunDiagnostics(customBenchmark.trim() ? customBenchmark.trim().toUpperCase() : benchmark, tf);
    };

    // Compounding Snowball Math Engine
    const simulation = useMemo(() => {
        const schedule: YearSnapshot[] = [];
        
        let sharePrice = 100;
        let sharesOwned = startingPrincipal > 0 ? startingPrincipal / sharePrice : 0;
        let annualDividendPerShare = sharePrice * (dividendYieldPct / 100);
        
        let totalContributed = startingPrincipal;
        let cumulativeDividends = 0;
        let crossoverYear: number | null = null;
        const annualOutofPocket = monthlyContribution * 12;

        const isHighYieldFund = dividendYieldPct > 10;
        const monthlyPriceGrowthRate = Math.pow(1 + Math.max(-0.95, priceGrowthRatePct / 100), 1 / 12) - 1;
        const annualDivGrowthMultiplier = 1 + Math.max(-0.95, dividendGrowthRatePct / 100);

        for (let y = 1; y <= years; y++) {
            if (y > 1 && !isHighYieldFund) {
                annualDividendPerShare *= annualDivGrowthMultiplier;
            }

            let annualDivForYear = 0;

            for (let m = 1; m <= 12; m++) {
                const currentMonthlyDivPerShare = isHighYieldFund
                    ? (sharePrice * (dividendYieldPct / 100)) / 12
                    : annualDividendPerShare / 12;

                const monthlyDiv = sharesOwned * currentMonthlyDivPerShare;
                annualDivForYear += monthlyDiv;
                cumulativeDividends += monthlyDiv;

                totalContributed += monthlyContribution;

                const cashToInvest = monthlyContribution + (dripEnabled ? monthlyDiv : 0);
                if (cashToInvest > 0 && sharePrice > 0) {
                    sharesOwned += cashToInvest / sharePrice;
                }

                sharePrice *= 1 + monthlyPriceGrowthRate;
            }

            const portfolioValue = sharesOwned * sharePrice;
            const currentRunRateDivPerShare = isHighYieldFund
                ? sharePrice * (dividendYieldPct / 100)
                : annualDividendPerShare;
            const runRateAnnualDividends = sharesOwned * currentRunRateDivPerShare;
            const runRateMonthlyDividends = runRateAnnualDividends / 12;

            const isCrossover = annualOutofPocket > 0 
                ? runRateAnnualDividends >= annualOutofPocket 
                : true;

            if (isCrossover && crossoverYear === null && annualOutofPocket > 0) {
                crossoverYear = y;
            }

            const yieldOnCost = totalContributed > 0 ? (runRateAnnualDividends / totalContributed) * 100 : 0;
            const reinvestedGains = Math.max(0, portfolioValue - totalContributed);

            schedule.push({
                year: y,
                portfolioValue: Math.round(portfolioValue),
                totalContributed: Math.round(totalContributed),
                annualDividends: Math.round(runRateAnnualDividends),
                monthlyDividends: Math.round(runRateMonthlyDividends),
                yieldOnCostPct: Number(yieldOnCost.toFixed(2)),
                cumulativeDividends: Math.round(cumulativeDividends),
                reinvestedGains: Math.round(reinvestedGains),
                isCrossover,
            });
        }

        const last = schedule[schedule.length - 1] || {
            portfolioValue: 0,
            annualDividends: 0,
            monthlyDividends: 0,
            yieldOnCostPct: 0,
        };

        return {
            schedule,
            crossoverYear,
            finalPortfolioValue: last.portfolioValue,
            finalAnnualDividends: last.annualDividends,
            finalMonthlyDividends: last.monthlyDividends,
            finalYieldOnCost: last.yieldOnCostPct,
            totalContributed,
            cumulativeDividends: Math.round(cumulativeDividends),
        };
    }, [
        startingPrincipal,
        monthlyContribution,
        dividendYieldPct,
        dividendGrowthRatePct,
        priceGrowthRatePct,
        years,
        dripEnabled,
    ]);

    // AI Coaching execution
    const handleRunAiCoach = async () => {
        setAnalyzingAi(true);
        const res = await analyzeDividendSnowball({
            tickerSymbol: portfolioName || "PORTFOLIO",
            startingPrincipal,
            monthlyContribution,
            initialYieldPct: dividendYieldPct,
            annualDivGrowthPct: dividendGrowthRatePct,
            annualAppreciationPct: priceGrowthRatePct,
            years,
            dripEnabled,
            targetMonthlyIncome,
            finalPortfolioValue: simulation.finalPortfolioValue,
            finalAnnualDividends: simulation.finalAnnualDividends,
            finalMonthlyDividends: simulation.finalMonthlyDividends,
            crossoverYear: simulation.crossoverYear,
            yieldOnCostPct: simulation.finalYieldOnCost,
            totalContributed: simulation.totalContributed,
            totalDividendsEarned: simulation.cumulativeDividends,
        });
        setAnalyzingAi(false);

        if (res.ok && res.data) {
            setAiAnalysis(res.data);
            toast.success("AI Strategy Coaching generated!");
        } else {
            toast.error(res.error || "Coaching analysis failed");
        }
    };

    if (!open) return null;

    const health = result?.health;
    const metrics = result?.metrics;

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-muted/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center flex-none">
                                <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                    Portfolio Intelligence Hub
                                </span>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-foreground mt-0.5">
                                    {portfolioName || "My Portfolio"}
                                </DialogTitle>
                            </div>
                        </div>

                        {/* Top Action & Benchmark Badge */}
                        <div className="flex items-center gap-2.5">
                            {result && (
                                <Badge className="rounded-none bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-2.5 py-1">
                                    VS {result.benchmark} ({timeframe.toUpperCase()})
                                </Badge>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRunDiagnostics()}
                                disabled={isCalculating}
                                className="h-8 rounded-none border-border/60 text-xs font-black uppercase tracking-wider gap-1.5 hover:bg-primary/10 hover:text-primary"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isCalculating && "animate-spin text-primary")} />
                                <span>{isCalculating ? "Calculating..." : "Recalculate"}</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Diagnostics Parameter Bar */}
                <div className="px-6 py-3 border-b border-border/40 bg-background/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Benchmark Selection Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-none">
                            Benchmark:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {BENCHMARK_OPTIONS.map((b) => (
                                <button
                                    key={b.value}
                                    onClick={() => handleSelectBenchmark(b.value)}
                                    className={cn(
                                        "px-2.5 py-1 text-[11px] font-mono font-bold transition-all border",
                                        benchmark === b.value && !customBenchmark
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-muted/20 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/40"
                                    )}
                                    title={b.desc}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                        {/* Custom Symbol Input */}
                        <div className="flex items-center gap-1 ml-1">
                            <Input
                                value={customBenchmark}
                                onChange={(e) => setCustomBenchmark(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && customBenchmark.trim()) {
                                        handleRunDiagnostics(customBenchmark.trim(), timeframe);
                                    }
                                }}
                                placeholder="Custom (e.g. VOO)"
                                className="h-7 w-28 text-[11px] font-mono font-bold uppercase rounded-none bg-background/60 border-border/60"
                            />
                            {customBenchmark.trim() && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleRunDiagnostics(customBenchmark.trim(), timeframe)}
                                    className="h-7 px-2 text-[10px] font-black uppercase rounded-none"
                                >
                                    Apply
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Timeframe Selection Pills */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-none">
                            Period:
                        </span>
                        <div className="flex border border-border/60 bg-muted/20 p-0.5">
                            {TIMEFRAME_OPTIONS.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => handleSelectTimeframe(tf.value)}
                                    className={cn(
                                        "px-2.5 py-0.5 text-[11px] font-mono font-bold transition-all",
                                        timeframe === tf.value
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        {/* Advanced Controls Toggle */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors ml-1 uppercase tracking-wider"
                        >
                            <Sliders className="w-3 h-3" />
                            <span>{showAdvanced ? "Hide RFR" : "Advanced"}</span>
                            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>
                </div>

                {/* Advanced Parameter Drawer */}
                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 py-3 bg-muted/20 border-b border-border/40 overflow-hidden"
                        >
                            <div className="flex items-center gap-6 text-xs max-w-xl">
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Risk-Free Rate (Annual Treasury):
                                        </Label>
                                        <span className="font-mono font-bold text-primary">{riskFreeRate}%</span>
                                    </div>
                                    <Slider
                                        value={[parseFloat(riskFreeRate) || 4.5]}
                                        min={0.0}
                                        max={10.0}
                                        step={0.25}
                                        onValueChange={([v]) => setRiskFreeRate(v.toFixed(2))}
                                    />
                                    <span className="text-[9px] text-muted-foreground block">
                                        Used for CAPM Alpha & Sharpe/Sortino ratios calculation (US 10-Yr Yield default ~4.5%).
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleRunDiagnostics()}
                                    className="rounded-none h-7 px-3 text-[10px] font-black uppercase"
                                >
                                    Update Ratios
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs Navigation */}
                <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)} className="w-full">
                    <div className="px-6 border-b border-border/40 bg-card/60">
                        <TabsList variant="line" className="h-10 p-0 gap-6">
                            <TabsTrigger 
                                value="historical" 
                                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs font-black uppercase tracking-wider px-1 pb-2 pt-2.5"
                            >
                                <Activity className="w-3.5 h-3.5 mr-1.5" />
                                1. Historical & Benchmark
                            </TabsTrigger>
                            <TabsTrigger 
                                value="snowball" 
                                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs font-black uppercase tracking-wider px-1 pb-2 pt-2.5"
                            >
                                <Snowflake className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                                2. Snowball & Compounding
                            </TabsTrigger>
                            <TabsTrigger 
                                value="attribution" 
                                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs font-black uppercase tracking-wider px-1 pb-2 pt-2.5"
                            >
                                <PieChart className="w-3.5 h-3.5 mr-1.5" />
                                3. Asset Attribution
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
                        {isCalculating && !result ? (
                            <div className="py-24 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Analyzing portfolio volatility, returns & benchmark data...
                                </p>
                            </div>
                        ) : !result ? (
                            <div className="py-16 text-center text-xs text-muted-foreground uppercase tracking-widest">
                                No performance data available. Please click Recalculate to generate diagnostics.
                            </div>
                        ) : (
                            <>
                                {/* TAB 1: HISTORICAL & BENCHMARK DIAGNOSTICS */}
                                <TabsContent value="historical" className="mt-0 space-y-6">
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
                                </TabsContent>

                                {/* TAB 2: SNOWBALL & COMPOUNDING ENGINE */}
                                <TabsContent value="snowball" className="mt-0 space-y-6">
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
                                                    value={[startingPrincipal]}
                                                    min={1000}
                                                    max={500000}
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
                                                    value={[dividendYieldPct]}
                                                    min={0.5}
                                                    max={35.0}
                                                    step={0.1}
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
                                                onClick={handleRunAiCoach}
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
                                </TabsContent>

                                {/* TAB 3: ASSET ATTRIBUTION & LIVE HOLDINGS */}
                                <TabsContent value="attribution" className="mt-0 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Asset Holdings & Return Contribution ({timeframe.toUpperCase()})
                                        </span>
                                    </div>

                                    <div className="border border-border/50 overflow-hidden bg-card/20">
                                        <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <span>Symbol</span>
                                            <span className="text-right">Shares</span>
                                            <span className="text-right">Live Price</span>
                                            <span className="text-right">Position Value</span>
                                            <span className="text-right">Weight</span>
                                            <span className="text-right">Contribution</span>
                                        </div>

                                        <div className="divide-y divide-border/25 max-h-72 overflow-y-auto custom-scrollbar">
                                            {result.asset_attribution && result.asset_attribution.length > 0 ? (
                                                result.asset_attribution.map((item) => (
                                                    <div key={item.symbol} className="grid grid-cols-6 gap-2 px-4 py-3 items-center hover:bg-muted/10 transition-colors font-mono text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-sm italic text-primary">{item.symbol}</span>
                                                        </div>
                                                        <span className="text-right text-muted-foreground">
                                                            {item.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-right text-foreground font-bold">
                                                            ${item.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-right text-foreground font-bold">
                                                            ${item.current_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-right text-muted-foreground">
                                                            {(item.weight * 100).toFixed(1)}%
                                                        </span>
                                                        <div className="text-right">
                                                            <span className={cn("font-bold", item.contribution >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                                {item.contribution >= 0 ? "+" : ""}{(item.contribution * 100).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                Object.entries(result.current_prices || {}).map(([symbol, price]) => (
                                                    <div key={symbol} className="grid grid-cols-3 gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors font-mono text-xs">
                                                        <span className="font-black text-sm italic text-primary">{symbol}</span>
                                                        <span className="text-right text-muted-foreground">—</span>
                                                        <span className="text-right font-bold text-foreground">
                                                            ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-border/50 bg-muted/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>Portfolio ID: {portfolioId}</span>
                        {result?.benchmark && <span>• Benchmark: {result.benchmark}</span>}
                    </div>
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="rounded-none bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-xs tracking-widest h-8 px-5"
                    >
                        Close Diagnostics
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PerformanceTrackerDialog;
