"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
    Activity, 
    Snowflake, 
    Loader2, 
    PieChart 
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { getPortfolioCandidates, savePerformanceResultToPortfolio } from "@/lib/actions/assets";
import { analyzeDividendSnowball } from "@/controllers/ai-controller";

// Modular Subcomponents & Types
import { 
    PerformanceResult, 
    PerformanceChartPoint, 
    AssetAttribution, 
    YearSnapshot, 
    BENCHMARK_OPTIONS 
} from "./performance-tracker/types";
import { TrackerHeader } from "./performance-tracker/tracker-header";
import { ParameterBar } from "./performance-tracker/parameter-bar";
import { AdvancedDrawer } from "./performance-tracker/advanced-drawer";
import { TabHistorical } from "./performance-tracker/tab-historical";
import { TabSnowball } from "./performance-tracker/tab-snowball";
import { TabAttribution } from "./performance-tracker/tab-attribution";
import { TrackerFooter } from "./performance-tracker/tracker-footer";

export type { 
    PerformanceResult, 
    PerformanceChartPoint, 
    AssetAttribution, 
    YearSnapshot 
};

interface PerformanceTrackerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolioId: number;
    portfolioName: string;
    initialResult?: PerformanceResult | null;
    onResultUpdated?: (result: PerformanceResult) => void;
}

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

    const seededResultKeyRef = useRef<string | null>(null);

    // Seed Snowball Parameters from Portfolio Results (seeded once per new calculation result)
    useEffect(() => {
        if (!result) return;

        const resultKey = `${portfolioId}-${result.benchmark}-${result.timeframe || "1y"}-${result.health?.score}`;
        if (seededResultKeyRef.current === resultKey) return;
        seededResultKeyRef.current = resultKey;

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
                let weightedYieldSum = 0;
                candidatesData.forEach(c => {
                    const asset = assetsInPortfolio.find(a => a.symbol.toUpperCase() === c.symbol.toUpperCase());
                    const shares = asset?.shares ?? 0;
                    const price = result.current_prices[c.symbol.toUpperCase()] || 0;
                    const val = shares * price;
                    const rawYield = c.dividend_yield || 0; // Already a percentage (e.g. 0.33 for AAPL, 0.73 for MSFT, 3.0 for SCHD)
                    weightedYieldSum += val * rawYield;
                });

                if (computedTotalValue > 0 && weightedYieldSum > 0) {
                    const weightedY = weightedYieldSum / computedTotalValue;
                    setDividendYieldPct(Number(weightedY.toFixed(2)));
                } else {
                    setDividendYieldPct(1.5);
                }
            }).catch(e => console.error(e));
        }

        // 3. Set Price Growth expectation from annualized return if available
        const annReturn = result.metrics.annualized_portfolio_return ?? result.metrics.portfolio_return_1y;
        if (annReturn && typeof annReturn === "number") {
            const expGrowth = Math.max(-5, (annReturn * 100) - 2.0);
            setPriceGrowthRatePct(Number(expGrowth.toFixed(1)));
        }
    }, [result, portfolioId, userAssets]);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <TrackerHeader
                    portfolioName={portfolioName}
                    benchmark={result?.benchmark}
                    timeframe={timeframe}
                    isCalculating={isCalculating}
                    hasResult={!!result}
                    onRecalculate={() => handleRunDiagnostics()}
                />

                {/* Diagnostics Parameter Bar */}
                <ParameterBar
                    benchmark={benchmark}
                    customBenchmark={customBenchmark}
                    timeframe={timeframe}
                    showAdvanced={showAdvanced}
                    onSelectBenchmark={handleSelectBenchmark}
                    onCustomBenchmarkChange={setCustomBenchmark}
                    onCustomBenchmarkApply={() => handleRunDiagnostics(customBenchmark.trim(), timeframe)}
                    onSelectTimeframe={handleSelectTimeframe}
                    onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                />

                {/* Advanced Parameter Drawer */}
                <AdvancedDrawer
                    show={showAdvanced}
                    riskFreeRate={riskFreeRate}
                    onRiskFreeRateChange={setRiskFreeRate}
                    onUpdateRatios={() => handleRunDiagnostics()}
                />

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
                                <TabsContent value="historical" className="mt-0">
                                    <TabHistorical result={result} timeframe={timeframe} />
                                </TabsContent>

                                {/* TAB 2: SNOWBALL & COMPOUNDING ENGINE */}
                                <TabsContent value="snowball" className="mt-0">
                                    <TabSnowball
                                        startingPrincipal={startingPrincipal}
                                        setStartingPrincipal={setStartingPrincipal}
                                        monthlyContribution={monthlyContribution}
                                        setMonthlyContribution={setMonthlyContribution}
                                        dividendYieldPct={dividendYieldPct}
                                        setDividendYieldPct={setDividendYieldPct}
                                        dividendGrowthRatePct={dividendGrowthRatePct}
                                        setDividendGrowthRatePct={setDividendGrowthRatePct}
                                        priceGrowthRatePct={priceGrowthRatePct}
                                        setPriceGrowthRatePct={setPriceGrowthRatePct}
                                        years={years}
                                        setYears={setYears}
                                        dripEnabled={dripEnabled}
                                        setDripEnabled={setDripEnabled}
                                        targetMonthlyIncome={targetMonthlyIncome}
                                        setTargetMonthlyIncome={setTargetMonthlyIncome}
                                        snowballTab={snowballTab}
                                        setSnowballTab={setSnowballTab}
                                        showSchedule={showSchedule}
                                        setShowSchedule={setShowSchedule}
                                        simulation={simulation}
                                        analyzingAi={analyzingAi}
                                        aiAnalysis={aiAnalysis}
                                        onRunAiCoach={handleRunAiCoach}
                                        setAiAnalysis={setAiAnalysis}
                                    />
                                </TabsContent>

                                {/* TAB 3: ASSET ATTRIBUTION & LIVE HOLDINGS */}
                                <TabsContent value="attribution" className="mt-0">
                                    <TabAttribution result={result} timeframe={timeframe} />
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>

                {/* Footer */}
                <TrackerFooter
                    portfolioId={portfolioId}
                    benchmark={result?.benchmark}
                    onClose={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
};

export default PerformanceTrackerDialog;
