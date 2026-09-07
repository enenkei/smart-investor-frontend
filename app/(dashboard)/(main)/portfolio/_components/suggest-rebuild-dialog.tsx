"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
    Scale, 
    ShieldAlert, 
    CheckCircle2, 
    ArrowRight, 
    Loader2,
    RefreshCw,
    Sliders,
    ChevronDown,
    ChevronUp,
    DollarSign,
    Percent,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { saveOptimizationToPortfolio, getPortfolioCandidates } from "@/lib/actions/assets";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { useRouter } from "next/navigation";

export interface RebuildResult {
    success: boolean;
    mode?: "rebuild" | "rebalance";
    rebalance_recommended: boolean;
    message: string;
    current_portfolio: {
        total_value?: number;
        health_score: number;
        metrics: {
            return_1y: number;
            volatility_1y: number;
            benchmark_volatility_1y?: number;
            empirical_beta?: number;
            sharpe_ratio: number;
            max_drawdown: number;
            dividend_yield?: number;
            current_monthly_income: number;
            diversification_score?: number;
        };
    };
    rebalanced_portfolio: {
        total_value?: number;
        holdings: Record<string, {
            weight: number;
            shares: number;
            price: number;
        }>;
        metrics: {
            expected_return: number;
            volatility: number;
            sharpe_ratio: number;
            dividend_yield: number;
            monthly_income: number;
        };
    };
}

interface SuggestRebuildDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portfolioId: number;
    portfolioName: string;
    initialResult?: RebuildResult | null;
}

export function SuggestRebuildDialog({
    open,
    onOpenChange,
    portfolioId,
    portfolioName,
    initialResult,
}: SuggestRebuildDialogProps) {
    const { fetchUserPortfolios, fetchUserAssets, userAssets } = usePortfolioStore();
    const router = useRouter();

    // Rebuild configuration parameters
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState<string>("0");
    const [monthlyContribution, setMonthlyContribution] = useState<string>("0");
    const [reinvestDividend, setReinvestDividend] = useState<boolean>(true);
    const [allowCandidateReplacements, setAllowCandidateReplacements] = useState<boolean>(false);
    const [allowFractionalShares, setAllowFractionalShares] = useState<boolean>(false);
    const [maxWeightPerAsset, setMaxWeightPerAsset] = useState<number>(0.35);
    const [riskFreeRate, setRiskFreeRate] = useState<string>("4.5"); // in percentage (4.5% = 0.045)

    // UI state
    const [showParameters, setShowParameters] = useState<boolean>(true);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [result, setResult] = useState<RebuildResult | null>(initialResult || null);

    // Synchronize initial result when provided
    useEffect(() => {
        if (initialResult) {
            setResult(initialResult);
        }
    }, [initialResult]);

    // Execute the suggest-rebuild API request
    const handleCalculateRebuild = useCallback(async () => {
        if (!portfolioId) return;

        setIsCalculating(true);
        try {
            const assetsInPortfolio = userAssets.filter((a) => a.portfolio_id === portfolioId);
            if (assetsInPortfolio.length === 0) {
                toast.error("The selected portfolio has no assets to rebuild.");
                return;
            }

            const tickers = assetsInPortfolio.map((a) => a.symbol);
            const candidatesData = await getPortfolioCandidates(tickers);
            const sharesMap = new Map(
                assetsInPortfolio.map((a) => [a.symbol.toUpperCase(), a.shares ?? 0])
            );

            const formattedCandidates = candidatesData.map((c) => ({
                symbol: c.symbol,
                total_return: c.total_return,
                beta: c.beta,
                asset_type: c.asset_type,
                dividend_yield: c.dividend_yield,
            }));

            const shares = formattedCandidates.map(
                (c) => sharesMap.get(c.symbol.toUpperCase()) ?? 0
            );

            const rfrNumber = (parseFloat(riskFreeRate) || 4.5) / 100;

            const payload = {
                candidates: formattedCandidates,
                shares: shares,
                target_monthly_income: parseFloat(targetMonthlyIncome) || 0,
                monthly_contribution: parseFloat(monthlyContribution) || 0,
                reinvest_dividend: reinvestDividend,
                allow_candidate_replacements: allowCandidateReplacements,
                allow_fractional_shares: allowFractionalShares,
                max_weight_per_asset: maxWeightPerAsset,
                risk_free_rate: rfrNumber,
            };

            const res = await fetch("/api/portfolio/suggest-rebuild", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            if (data.success) {
                setResult(data);
                toast.success(
                    data.mode === "rebuild"
                        ? "Generated Rebuild suggestions with candidate substitutions!"
                        : "Generated Rebalance suggestions for current holdings!"
                );
            } else {
                toast.error(data.error || "Failed to generate suggestions");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to calculate rebuild");
        } finally {
            setIsCalculating(false);
        }
    }, [
        portfolioId,
        userAssets,
        targetMonthlyIncome,
        monthlyContribution,
        reinvestDividend,
        allowCandidateReplacements,
        allowFractionalShares,
        maxWeightPerAsset,
        riskFreeRate,
    ]);

    const handleApplyRebalance = async () => {
        if (!result) return;
        setIsSaving(true);
        try {
            const { rebalanced_portfolio } = result;
            const tickers = Object.keys(rebalanced_portfolio.holdings);
            const shares: Record<string, number> = {};
            const prices: Record<string, number> = {};
            const weights: Record<string, number> = {};

            tickers.forEach((t) => {
                const h = rebalanced_portfolio.holdings[t];
                shares[t] = h.shares;
                prices[t] = h.price;
                weights[t] = h.weight;
            });

            const mockProjections = Array.from({ length: 31 }, (_, i) => ({
                year: i,
                portfolio_value: 0,
                cumulative_contributions: 0,
                monthly_income: rebalanced_portfolio.metrics?.monthly_income ?? 0,
            }));

            await saveOptimizationToPortfolio(
                {
                    tickers,
                    shares,
                    prices,
                    weights,
                    projections: mockProjections,
                    metrics: {
                        sharpe_ratio: rebalanced_portfolio.metrics?.sharpe_ratio ?? 0,
                        expected_return: rebalanced_portfolio.metrics?.expected_return ?? 0,
                        expected_volatility: rebalanced_portfolio.metrics?.volatility ?? 0,
                        dividend_yield: rebalanced_portfolio.metrics?.dividend_yield ?? 0,
                    },
                    name: portfolioName,
                },
                portfolioId
            );

            toast.success("Portfolio successfully rebalanced & updated in database!");
            await fetchUserPortfolios();
            await fetchUserAssets();
            router.refresh();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to execute rebalance");
        } finally {
            setIsSaving(false);
        }
    };

    const current_portfolio = result?.current_portfolio;
    const rebalanced_portfolio = result?.rebalanced_portfolio;
    const rebalance_recommended = result?.rebalance_recommended ?? false;
    const mode = result?.mode ?? (allowCandidateReplacements ? "rebuild" : "rebalance");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                                <Scale className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    Intelligent Rebalancing & Optimization
                                </span>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-foreground">
                                    Rebuild Portfolio: {portfolioName}
                                </DialogTitle>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`rounded-none font-black uppercase tracking-widest text-[9px] px-2 py-0.5 border ${
                                    mode === "rebuild"
                                        ? "border-violet-500/30 text-violet-400 bg-violet-500/10"
                                        : "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                                }`}
                            >
                                Mode: {mode.toUpperCase()}
                            </Badge>

                            {result && (
                                <Badge
                                    className={`rounded-none font-black uppercase tracking-widest text-[9px] px-2 py-0.5 border ${
                                        rebalance_recommended
                                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    }`}
                                >
                                    {rebalance_recommended ? "Rebalance Recommended" : "Excellent Health"}
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Collapsible Rebuild Parameters Control Deck */}
                    <div className="border border-border/50 bg-card/20">
                        <button
                            type="button"
                            onClick={() => setShowParameters(!showParameters)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 text-left hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                                    Rebuild Parameters & Constraints
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                    {showParameters ? "Hide Controls" : "Configure Parameters"}
                                </span>
                                {showParameters ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                        </button>

                        {showParameters && (
                            <div className="p-4 space-y-4 border-t border-border/40 bg-muted/5">
                                {/* Mode & Share Rules */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Candidate Replacements */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="switch-replacements"
                                                className="text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                            >
                                                Candidate Replacements
                                            </Label>
                                            <Switch
                                                id="switch-replacements"
                                                checked={allowCandidateReplacements}
                                                onCheckedChange={setAllowCandidateReplacements}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground leading-snug">
                                            {allowCandidateReplacements
                                                ? "Rebuild: May substitute weak assets with better universe candidates"
                                                : "Rebalance: Constrained strictly to existing holdings"}
                                        </span>
                                    </div>

                                    {/* Fractional Shares */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="switch-fractional"
                                                className="text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                            >
                                                Fractional Shares
                                            </Label>
                                            <Switch
                                                id="switch-fractional"
                                                checked={allowFractionalShares}
                                                onCheckedChange={setAllowFractionalShares}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground leading-snug">
                                            {allowFractionalShares
                                                ? "Permits fractional share decimals for mathematically exact weights"
                                                : "Rounds suggested shares to nearest whole units"}
                                        </span>
                                    </div>

                                    {/* Reinvest Dividends */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="switch-reinvest"
                                                className="text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                            >
                                                Reinvest Dividends
                                            </Label>
                                            <Switch
                                                id="switch-reinvest"
                                                checked={reinvestDividend}
                                                onCheckedChange={setReinvestDividend}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground leading-snug">
                                            Compounds cash dividend distributions back into total return
                                        </span>
                                    </div>
                                </div>

                                {/* Weight Slider, Targets & Risk Parameters */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                                    {/* Max Weight Per Asset Slider */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-wider">
                                                Max Weight Per Asset
                                            </Label>
                                            <span className="font-mono font-bold text-xs text-primary">
                                                {Math.round(maxWeightPerAsset * 100)}%
                                            </span>
                                        </div>
                                        <Slider
                                            value={[maxWeightPerAsset * 100]}
                                            onValueChange={(val) => setMaxWeightPerAsset(val[0] / 100)}
                                            min={10}
                                            max={100}
                                            step={5}
                                            className="w-full py-1"
                                        />
                                        <span className="text-[9px] text-muted-foreground">
                                            Caps single holding concentration to ensure diversification
                                        </span>
                                    </div>

                                    {/* Target Monthly Income */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Target Monthly Income ($)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                step="50"
                                                min="0"
                                                value={targetMonthlyIncome}
                                                onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                                className="h-8 pl-7 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Desired dividend cashflow</span>
                                    </div>

                                    {/* Monthly Contribution */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Monthly Contrib. ($)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                step="50"
                                                min="0"
                                                value={monthlyContribution}
                                                onChange={(e) => setMonthlyContribution(e.target.value)}
                                                className="h-8 pl-7 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">New capital injection</span>
                                    </div>

                                    {/* Risk-Free Rate */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                Benchmark Risk-Free Rate (%)
                                            </Label>
                                            <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                                {(parseFloat(riskFreeRate) || 0).toFixed(2)}% APR
                                            </span>
                                        </div>
                                        <div className="relative max-w-xs">
                                            <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="20"
                                                value={riskFreeRate}
                                                onChange={(e) => setRiskFreeRate(e.target.value)}
                                                className="h-8 pr-7 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Baseline rate (e.g. 10Y Treasury yield) used to calculate Sharpe and risk-adjusted metrics</span>
                                    </div>
                                </div>

                                {/* Rebuild Trigger Button */}
                                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-border/30 gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        <span>Configure all parameters and run the portfolio optimization engine.</span>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleCalculateRebuild}
                                        disabled={isCalculating}
                                        className="w-full sm:w-auto h-9 px-5 rounded-none font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                                    >
                                        {isCalculating ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Optimizing...
                                            </>
                                        ) : result ? (
                                            <>
                                                <RefreshCw className="w-3.5 h-3.5" /> Recalculate Rebuild
                                            </>
                                        ) : (
                                            <>
                                                <Scale className="w-3.5 h-3.5" /> Run Rebuild Analysis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Empty State before first calculation */}
                    {!result && !isCalculating && (
                        <div className="p-8 border border-dashed border-border/60 bg-muted/5 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Scale className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1 max-w-md">
                                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                                    Ready to Rebuild & Optimize
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Select your mode (Rebalance within holdings or Rebuild with substitutions), choose fractional shares, dividend reinvestment, max concentration limit, income targets, and click <strong className="text-foreground">Run Rebuild Analysis</strong>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State when calculating initial or refreshed result */}
                    {isCalculating && !result && (
                        <div className="h-48 border border-border/40 bg-card/10 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Optimizing Portfolio Allocations...
                            </span>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Glowing Alert Status Card */}
                            <div
                                className={`border p-4 flex items-start gap-4 ${
                                    rebalance_recommended
                                        ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                                        : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                                }`}
                            >
                                {rebalance_recommended ? (
                                    <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                                )}
                                <div className="space-y-1">
                                    <span className="font-black text-sm uppercase tracking-wider">
                                        {rebalance_recommended
                                            ? "Sub-Optimal Allocation Found"
                                            : "Holdings in Peak Alignment"}
                                    </span>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {result.message}
                                    </p>
                                </div>
                            </div>

                            {/* Side-by-Side Current vs Rebalanced Comparison Grid */}
                            {current_portfolio && rebalanced_portfolio && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Portfolio Rebuild Diagnostics
                                        </span>
                                        {current_portfolio.total_value != null && (
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                Portfolio Capital:{" "}
                                                <strong className="text-foreground">
                                                    ${current_portfolio.total_value.toLocaleString("en-US", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </strong>
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                Health Score
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-black font-mono text-muted-foreground/60">
                                                    {current_portfolio.health_score?.toFixed(0) ?? "—"}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                                <span className="text-lg font-black font-mono text-emerald-400">
                                                    85+
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                Exp. Return
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-black font-mono text-muted-foreground/60">
                                                    {current_portfolio.metrics?.return_1y?.toFixed(1) ?? "—"}%
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                                <span className="text-lg font-black font-mono text-emerald-400">
                                                    {rebalanced_portfolio.metrics?.expected_return?.toFixed(1) ?? "—"}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                Volatility
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-black font-mono text-muted-foreground/60">
                                                    {current_portfolio.metrics?.volatility_1y?.toFixed(1) ?? "—"}%
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                                <span className="text-lg font-black font-mono text-violet-400">
                                                    {rebalanced_portfolio.metrics?.volatility?.toFixed(1) ?? "—"}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                Sharpe Ratio
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-black font-mono text-muted-foreground/60">
                                                    {current_portfolio.metrics?.sharpe_ratio?.toFixed(2) ?? "—"}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                                <span className="text-lg font-black font-mono text-foreground">
                                                    {rebalanced_portfolio.metrics?.sharpe_ratio?.toFixed(2) ?? "—"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                                Mo. Income
                                            </span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-sm font-black font-mono text-muted-foreground/60">
                                                    {current_portfolio.metrics?.current_monthly_income != null
                                                        ? `$${current_portfolio.metrics.current_monthly_income.toFixed(0)}`
                                                        : "—"}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                                <span className="text-lg font-black font-mono text-amber-400">
                                                    {rebalanced_portfolio.metrics?.monthly_income != null
                                                        ? `$${rebalanced_portfolio.metrics.monthly_income.toFixed(0)}`
                                                        : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rebalanced Holdings Table */}
                            {rebalanced_portfolio && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            Intelligent Suggested Allocation ({Object.keys(rebalanced_portfolio.holdings).length} Assets)
                                        </span>
                                    </div>

                                    <div className="border border-border/50 overflow-hidden bg-card/10">
                                        <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-muted/20 border-b border-border/40 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                Asset Ticker
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">
                                                Price
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">
                                                Suggested Shares
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">
                                                Target Weight
                                            </span>
                                        </div>

                                        <div className="divide-y divide-border/30 max-h-56 overflow-y-auto custom-scrollbar">
                                            {Object.entries(rebalanced_portfolio.holdings).map(([symbol, h]) => (
                                                <div
                                                    key={symbol}
                                                    className="grid grid-cols-4 gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm italic text-primary">
                                                            {symbol}
                                                        </span>
                                                    </div>
                                                    <span className="text-right font-mono text-xs font-medium text-muted-foreground">
                                                        ${h.price.toLocaleString("en-US", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                    <span className="text-right font-mono text-xs font-bold text-foreground">
                                                        {h.shares}
                                                    </span>
                                                    <span className="text-right font-mono text-xs font-black text-primary">
                                                        {(h.weight * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border/50 bg-muted/5 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-none border-border/60 hover:bg-muted/50 font-black uppercase text-xs tracking-widest h-9 px-5"
                        disabled={isSaving}
                    >
                        Dismiss Suggestion
                    </Button>
                    <Button
                        onClick={handleApplyRebalance}
                        className="rounded-none bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-xs tracking-widest h-9 px-6 gap-2"
                        disabled={isSaving || !result || !rebalance_recommended}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rebalancing...
                            </>
                        ) : (
                            <>
                                <Scale className="w-3.5 h-3.5" /> Execute Rebalance & Save
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default SuggestRebuildDialog;
