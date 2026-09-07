"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PortfolioCandidate, saveOptimizationToPortfolio } from "@/lib/actions/assets";
import {
    Zap,
    DollarSign,
    Loader2,
    Sliders,
    Target,
    Shield,
    Layers,
    PieChart,
    Calendar,
    Plus,
    X,
    Check,
    Ban,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OptimizedPortfolio } from "@/lib/data-types";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import AutoOptimizer from "./manual/auto-optimizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Props = {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    candidates: PortfolioCandidate[];
    candidatesLoading: boolean;
    optimizationResult: OptimizedPortfolio | null;
    setOptimizationResult: (result: OptimizedPortfolio | null) => void;
    portfolio_id: number;
};

const SECTOR_OPTIONS = [
    "Technology",
    "Financial Services",
    "Healthcare",
    "Energy",
    "Consumer Cyclical",
    "Consumer Defensive",
    "Industrials",
    "Communication Services",
    "Utilities",
    "Real Estate",
    "Basic Materials",
];

const PRIMARY_GOAL_OPTIONS = [
    { value: "balanced", label: "Balanced", desc: "Growth & income balance" },
    { value: "growth", label: "Growth", desc: "Long-term capital growth" },
    { value: "aggressive_growth", label: "Aggressive Growth", desc: "High-beta maximized appreciation" },
    { value: "income", label: "Income", desc: "Maximized dividend cashflow" },
    { value: "capital_preservation", label: "Capital Preservation", desc: "Defensive capital safety" },
];

const RISK_TOLERANCE_OPTIONS = [
    { value: "conservative", label: "Conservative", desc: "Low volatility & drawdown avoidance" },
    { value: "moderate", label: "Moderate", desc: "Balanced market risk exposure" },
    { value: "aggressive", label: "Aggressive", desc: "Tolerates high volatility for maximum upside" },
];

const ASSET_PREFERENCE_OPTIONS = [
    { value: "blend", label: "Blend (Stocks & ETFs)", desc: "Optimal mix of equities & funds" },
    { value: "stocks", label: "Stocks Only", desc: "Individual equities" },
    { value: "etfs", label: "ETFs Only", desc: "Diversified index & thematic funds" },
];

const PortfolioOptimizerDialog = (props: Props) => {
    const {
        dialogOpen,
        setDialogOpen,
        candidates,
        candidatesLoading,
        optimizationResult,
        setOptimizationResult,
        portfolio_id,
    } = props;
    const router = useRouter();
    const { fetchAll } = usePortfolioStore();

    // build-from-goal parameters
    const [totalBudget, setTotalBudget] = useState("10000");
    const [primaryGoal, setPrimaryGoal] = useState("balanced");
    const [riskTolerance, setRiskTolerance] = useState("moderate");
    const [assetPreference, setAssetPreference] = useState("blend");
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState("0");
    const [monthlyContribution, setMonthlyContribution] = useState("500");
    const [reinvestDividend, setReinvestDividend] = useState(true);
    const [targetAssetCount, setTargetAssetCount] = useState<number>(8);
    const [maxWeightPerAsset, setMaxWeightPerAsset] = useState<number>(0.25);
    const [allowFractionalShares, setAllowFractionalShares] = useState(false);
    const [projectionYears, setProjectionYears] = useState<number>(30);
    const [excludedSectors, setExcludedSectors] = useState<string[]>([]);
    const [excludedTickers, setExcludedTickers] = useState<string[]>([]);
    const [includeTickers, setIncludeTickers] = useState<string[]>([]);

    // Ticker input state for adding tags
    const [includeInput, setIncludeInput] = useState("");
    const [excludeInput, setExcludeInput] = useState("");

    // UI & Action States
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewPortfolio, setIsNewPortfolio] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Helpers for tags
    const handleAddIncludeTicker = (tickerToAdd?: string) => {
        const symbol = (tickerToAdd || includeInput).trim().toUpperCase();
        if (!symbol) return;
        if (!includeTickers.includes(symbol)) {
            setIncludeTickers([...includeTickers, symbol]);
        }
        // Remove from excluded if present
        if (excludedTickers.includes(symbol)) {
            setExcludedTickers(excludedTickers.filter(t => t !== symbol));
        }
        if (!tickerToAdd) setIncludeInput("");
    };

    const handleRemoveIncludeTicker = (symbol: string) => {
        setIncludeTickers(includeTickers.filter(t => t !== symbol));
    };

    const handleAddExcludeTicker = (tickerToAdd?: string) => {
        const symbol = (tickerToAdd || excludeInput).trim().toUpperCase();
        if (!symbol) return;
        if (!excludedTickers.includes(symbol)) {
            setExcludedTickers([...excludedTickers, symbol]);
        }
        // Remove from included if present
        if (includeTickers.includes(symbol)) {
            setIncludeTickers(includeTickers.filter(t => t !== symbol));
        }
        if (!tickerToAdd) setExcludeInput("");
    };

    const handleRemoveExcludeTicker = (symbol: string) => {
        setExcludedTickers(excludedTickers.filter(t => t !== symbol));
    };

    const toggleSectorExclusion = (sector: string) => {
        if (excludedSectors.includes(sector)) {
            setExcludedSectors(excludedSectors.filter(s => s !== sector));
        } else {
            setExcludedSectors([...excludedSectors, sector]);
        }
    };

    const handleOptimize = async () => {
        const budgetNum = parseFloat(totalBudget);
        if (isNaN(budgetNum) || budgetNum <= 0) {
            toast.error("Please enter a valid investment budget.");
            return;
        }

        setIsOptimizing(true);
        setOptimizationResult(null);

        try {
            const reqBody = {
                total_budget: budgetNum,
                primary_goal: primaryGoal,
                risk_tolerance: riskTolerance,
                target_monthly_income: parseFloat(targetMonthlyIncome) || 0,
                monthly_contribution: parseFloat(monthlyContribution) || 0,
                reinvest_dividend: reinvestDividend,
                asset_preference: assetPreference,
                target_asset_count: Math.max(1, targetAssetCount || 8),
                max_weight_per_asset: maxWeightPerAsset,
                excluded_sectors: excludedSectors,
                excluded_tickers: excludedTickers,
                include_tickers: includeTickers,
                allow_fractional_shares: allowFractionalShares,
                projection_years: Math.max(1, projectionYears || 30),
            };

            const res = await fetch("/api/portfolio/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
            });

            const responseText = await res.text();
            let data: any;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(responseText || "Optimization failed");
            }

            if (!res.ok) {
                let errorMessage = data.error || "Optimization failed";
                try {
                    const parsed = JSON.parse(errorMessage);
                    errorMessage = parsed.message || parsed.error || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }

            const raw = data.optimizedPortfolio || data;
            if (raw.error) {
                toast.error(raw.message || raw.error);
                return;
            }

            // Normalize response into standard OptimizedPortfolio format
            const normalizedResult: OptimizedPortfolio = {
                tickers: raw.tickers || (raw.holdings ? Object.keys(raw.holdings) : []),
                weights: raw.weights || {},
                prices: raw.prices || {},
                shares: raw.shares || {},
                projections: Array.isArray(raw.projections) ? raw.projections : [],
                metrics: {
                    expected_return: raw.metrics?.expected_return ?? raw.metrics?.return_1y ?? 0,
                    volatility: raw.metrics?.volatility ?? raw.metrics?.volatility_1y ?? 0,
                    sharpe_ratio: raw.metrics?.sharpe_ratio ?? 0,
                    dividend_yield: raw.metrics?.dividend_yield ?? 0,
                    target_monthly_income: parseFloat(targetMonthlyIncome) || 0,
                    requirements_to_target: raw.metrics?.requirements_to_target,
                },
            };

            if (raw.holdings && typeof raw.holdings === "object") {
                Object.entries(raw.holdings).forEach(([symbol, h]: [string, any]) => {
                    if (h && typeof h === "object") {
                        if (h.weight != null) normalizedResult.weights[symbol] = h.weight;
                        if (h.price != null) normalizedResult.prices[symbol] = h.price;
                        if (h.shares != null) normalizedResult.shares[symbol] = h.shares;
                    }
                });
            }

            setOptimizationResult(normalizedResult);
            toast.success("Goal-based portfolio successfully generated!");
        } catch (err: any) {
            toast.error(err.message || "Optimization failed");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSave = async () => {
        if (!optimizationResult) return;
        setIsSaving(true);
        try {
            await saveOptimizationToPortfolio(
                {
                    tickers: optimizationResult.tickers,
                    shares: optimizationResult.shares,
                    prices: optimizationResult.prices,
                    weights: optimizationResult.weights,
                    projections: optimizationResult.projections,
                    metrics: optimizationResult.metrics,
                    name: `Goal_${primaryGoal.toUpperCase()}_${Date.now() / 1000}`,
                },
                isNewPortfolio ? -1 : portfolio_id
            );
            toast.success("Portfolio saved! Assets updated as OWNED.");
            setDialogOpen(false);
            setOptimizationResult(null);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to save portfolio");
        } finally {
            setIsSaving(false);
            fetchAll();
        }
    };

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                    setOptimizationResult(null);
                }
            }}
        >
            <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight italic text-primary">
                                Goal-Based Portfolio Optimizer
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                                AI-driven asset selection & weighting tailored to your financial goals
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-6">
                    {!optimizationResult ? (
                        <div className="space-y-6">
                            {/* Banner */}
                            <div className="p-3 border-l-2 border-primary bg-primary/5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                                <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <strong className="text-foreground">Intelligent Goal Synthesis:</strong> Specify your target objective, risk tolerance, capital constraints, and universe filters to generate an optimal asset allocation model.
                                </div>
                            </div>

                            {/* Section 1: Capital & Goals */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Investment Capital & Objectives
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Total Budget */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Total Budget ($)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                min="100"
                                                step="500"
                                                value={totalBudget}
                                                onChange={(e) => setTotalBudget(e.target.value)}
                                                className="pl-7 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                                placeholder="10000"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Initial capital deployment</span>
                                    </div>

                                    {/* Primary Goal */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Primary Goal
                                        </Label>
                                        <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                                            <SelectTrigger className="h-8 w-full rounded-none bg-background/50 border-border/50 text-xs font-bold uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-border/60">
                                                {PRIMARY_GOAL_OPTIONS.map((g) => (
                                                    <SelectItem key={g.value} value={g.value} className="text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold uppercase tracking-wider">{g.label}</span>
                                                            <span className="text-[9px] text-muted-foreground">{g.desc}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[9px] text-muted-foreground">Optimization target</span>
                                    </div>

                                    {/* Risk Tolerance */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Risk Tolerance
                                        </Label>
                                        <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                                            <SelectTrigger className="h-8 w-full rounded-none bg-background/50 border-border/50 text-xs font-bold uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-border/60">
                                                {RISK_TOLERANCE_OPTIONS.map((r) => (
                                                    <SelectItem key={r.value} value={r.value} className="text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold uppercase tracking-wider">{r.label}</span>
                                                            <span className="text-[9px] text-muted-foreground">{r.desc}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[9px] text-muted-foreground">Volatility threshold</span>
                                    </div>

                                    {/* Asset Preference */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Asset Preference
                                        </Label>
                                        <Select value={assetPreference} onValueChange={setAssetPreference}>
                                            <SelectTrigger className="h-8 w-full rounded-none bg-background/50 border-border/50 text-xs font-bold uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-border/60">
                                                {ASSET_PREFERENCE_OPTIONS.map((p) => (
                                                    <SelectItem key={p.value} value={p.value} className="text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold uppercase tracking-wider">{p.label}</span>
                                                            <span className="text-[9px] text-muted-foreground">{p.desc}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[9px] text-muted-foreground">Instrument universe</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Cashflow & Execution Rules */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Cashflow Targets & Execution Controls
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Monthly Contribution */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Monthly Contribution ($)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={monthlyContribution}
                                                onChange={(e) => setMonthlyContribution(e.target.value)}
                                                className="pl-7 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                                placeholder="500"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Regular ongoing contribution</span>
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
                                                min="0"
                                                step="50"
                                                value={targetMonthlyIncome}
                                                onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                                className="pl-7 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Desired dividend cashflow</span>
                                    </div>

                                    {/* Projection Horizon */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col gap-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            Projection Years
                                        </Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="number"
                                                min="5"
                                                max="50"
                                                step="5"
                                                value={projectionYears}
                                                onChange={(e) => setProjectionYears(parseInt(e.target.value) || 30)}
                                                className="pl-7 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono font-bold"
                                            />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground">Simulated compound horizon</span>
                                    </div>
                                </div>

                                {/* Toggle switches */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 border border-border/40 bg-background/30 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <Label htmlFor="switch-reinvest-div" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">
                                                Reinvest Dividends
                                            </Label>
                                            <span className="text-[9px] text-muted-foreground">Compound dividend payouts</span>
                                        </div>
                                        <Switch
                                            id="switch-reinvest-div"
                                            checked={reinvestDividend}
                                            onCheckedChange={setReinvestDividend}
                                        />
                                    </div>

                                    <div className="p-3 border border-border/40 bg-background/30 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <Label htmlFor="switch-fractional-shares" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">
                                                Fractional Shares
                                            </Label>
                                            <span className="text-[9px] text-muted-foreground">Exact decimal allocations</span>
                                        </div>
                                        <Switch
                                            id="switch-fractional-shares"
                                            checked={allowFractionalShares}
                                            onCheckedChange={setAllowFractionalShares}
                                        />
                                    </div>

                                    <div className="p-3 border border-border/40 bg-background/30 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <Label htmlFor="switch-new-portfolio" className="text-[10px] font-black uppercase tracking-wider cursor-pointer">
                                                New Portfolio
                                            </Label>
                                            <span className="text-[9px] text-muted-foreground">Save as independent portfolio</span>
                                        </div>
                                        <Switch
                                            id="switch-new-portfolio"
                                            checked={isNewPortfolio}
                                            onCheckedChange={setIsNewPortfolio}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Portfolio Constraints */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Portfolio Sizing & Concentration Constraints
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Target Asset Count */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-wider">
                                                Target Asset Count
                                            </Label>
                                            <span className="font-mono font-bold text-xs text-primary">
                                                {targetAssetCount} Assets
                                            </span>
                                        </div>
                                        <Slider
                                            value={[targetAssetCount]}
                                            onValueChange={(val) => setTargetAssetCount(val[0])}
                                            min={3}
                                            max={20}
                                            step={1}
                                            className="w-full py-1"
                                        />
                                        <span className="text-[9px] text-muted-foreground">
                                            Desired number of holdings in optimized portfolio
                                        </span>
                                    </div>

                                    {/* Max Weight Per Asset */}
                                    <div className="p-3 border border-border/40 bg-background/30 flex flex-col justify-between gap-2">
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
                                            max={60}
                                            step={5}
                                            className="w-full py-1"
                                        />
                                        <span className="text-[9px] text-muted-foreground">
                                            Caps single holding concentration to prevent over-weighting
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Advanced Universe Filters (Excluded Sectors, Include/Exclude Tickers) */}
                            <div className="border border-border/40 bg-muted/5">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-black uppercase tracking-widest text-foreground">
                                            Universe Filters & Ticker Rules
                                        </span>
                                        {(excludedSectors.length > 0 || includeTickers.length > 0 || excludedTickers.length > 0) && (
                                            <Badge variant="outline" className="text-[9px] border-primary/40 text-primary py-0 px-1.5">
                                                Active Filters
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                                        <span>{showAdvancedFilters ? "Collapse" : "Expand"}</span>
                                        {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </div>
                                </button>

                                {showAdvancedFilters && (
                                    <div className="p-4 space-y-4 border-t border-border/40">
                                        {/* Excluded Sectors */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                    Excluded Sectors (Click to toggle)
                                                </Label>
                                                {excludedSectors.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExcludedSectors([])}
                                                        className="text-[9px] text-primary font-bold uppercase tracking-wider hover:underline"
                                                    >
                                                        Clear All Exclusions
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {SECTOR_OPTIONS.map((sector) => {
                                                    const isExcluded = excludedSectors.includes(sector);
                                                    return (
                                                        <button
                                                            key={sector}
                                                            type="button"
                                                            onClick={() => toggleSectorExclusion(sector)}
                                                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${isExcluded
                                                                ? "border-rose-500/40 bg-rose-500/10 text-rose-400 line-through"
                                                                : "border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground"
                                                                }`}
                                                        >
                                                            {isExcluded && <Ban className="w-3 h-3 text-rose-400" />}
                                                            {sector}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Include Tickers */}
                                        <div className="space-y-2 pt-1">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                Force-Include Tickers
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    value={includeInput}
                                                    onChange={(e) => setIncludeInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddIncludeTicker();
                                                        }
                                                    }}
                                                    placeholder="Enter ticker (e.g. AAPL) and press Enter"
                                                    className="h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono uppercase"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAddIncludeTicker()}
                                                    variant="outline"
                                                    className="h-8 px-3 rounded-none font-bold text-xs uppercase"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                                </Button>
                                            </div>

                                            {includeTickers.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {includeTickers.map((t) => (
                                                        <Badge
                                                            key={t}
                                                            className="rounded-none bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1 pl-2 pr-1 py-0.5"
                                                        >
                                                            {t}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveIncludeTicker(t)}
                                                                className="hover:text-emerald-200"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Candidate shortcuts */}
                                            {candidates.length > 0 && (
                                                <div className="pt-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                                                        Quick Add from Watchlist Candidates:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {candidates.slice(0, 10).map((c) => {
                                                            const isIncluded = includeTickers.includes(c.symbol);
                                                            return (
                                                                <button
                                                                    key={c.symbol}
                                                                    type="button"
                                                                    disabled={isIncluded}
                                                                    onClick={() => handleAddIncludeTicker(c.symbol)}
                                                                    className={`text-[9px] font-mono px-2 py-0.5 border transition-colors ${isIncluded
                                                                        ? "opacity-40 border-border/40 text-muted-foreground cursor-not-allowed"
                                                                        : "border-border/60 hover:border-primary text-foreground hover:text-primary"
                                                                        }`}
                                                                >
                                                                    +{c.symbol}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Excluded Tickers */}
                                        <div className="space-y-2 pt-1">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                Excluded Tickers
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    value={excludeInput}
                                                    onChange={(e) => setExcludeInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddExcludeTicker();
                                                        }
                                                    }}
                                                    placeholder="Enter ticker (e.g. TSLA) and press Enter"
                                                    className="h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono uppercase"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAddExcludeTicker()}
                                                    variant="outline"
                                                    className="h-8 px-3 rounded-none font-bold text-xs uppercase"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                                </Button>
                                            </div>

                                            {excludedTickers.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {excludedTickers.map((t) => (
                                                        <Badge
                                                            key={t}
                                                            className="rounded-none bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1 pl-2 pr-1 py-0.5"
                                                        >
                                                            {t}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExcludeTicker(t)}
                                                                className="hover:text-rose-200"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Optimize Action Button */}
                            <Button
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-11 px-6 gap-2 text-xs"
                            >
                                {isOptimizing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Goal-Based Portfolio...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" /> Run Goal-Based Optimization
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Badge className="rounded-none font-black uppercase tracking-wider text-[9px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                                        Goal: {primaryGoal.toUpperCase()}
                                    </Badge>
                                    <Badge className="rounded-none font-black uppercase tracking-wider text-[9px] px-2 py-0.5 bg-muted/40 text-muted-foreground border border-border/40">
                                        Risk: {riskTolerance.toUpperCase()}
                                    </Badge>
                                    <Badge className="rounded-none font-black uppercase tracking-wider text-[9px] px-2 py-0.5 bg-muted/40 text-muted-foreground border border-border/40">
                                        Universe: {assetPreference.toUpperCase()}
                                    </Badge>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOptimizationResult(null)}
                                    className="rounded-none text-xs font-bold uppercase tracking-wider h-7"
                                >
                                    Adjust Parameters
                                </Button>
                            </div>

                            <AutoOptimizer
                                optimizationResult={optimizationResult}
                                budget={totalBudget}
                                monthlyContribution={monthlyContribution}
                                setOptimizationResult={setOptimizationResult}
                                handleSave={handleSave}
                                isSaving={isSaving}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PortfolioOptimizerDialog;