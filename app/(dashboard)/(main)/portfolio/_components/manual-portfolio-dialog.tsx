"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FolderPlus,
    DollarSign,
    Loader2,
    Trash2,
    PieChart,
    Layers,
    ChevronDown,
    ChevronUp,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { EnrichedWatchlistItem } from "./watchlist/types";
import { saveManualPortfolio } from "@/lib/actions/assets";
import { user_portfolio } from "@/lib/db/schema";

interface ManualPortfolioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedSymbols: string[];
    watchlist: EnrichedWatchlistItem[];
    userPortfolios: user_portfolio[];
    onPortfolioCreated: (portfolioId: number) => void;
    onSelectionClear?: () => void;
}

const SEGMENT_COLORS = [
    "bg-emerald-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-teal-500",
];

export function ManualPortfolioDialog({
    open,
    onOpenChange,
    selectedSymbols: initialSymbols,
    watchlist,
    userPortfolios,
    onPortfolioCreated,
    onSelectionClear,
}: ManualPortfolioDialogProps) {
    // Current active symbols in the draft portfolio
    const [symbols, setSymbols] = useState<string[]>(initialSymbols);

    // Shares mapping { AAPL: 10, NVDA: 5 }
    const [sharesMap, setSharesMap] = useState<Record<string, string>>({});

    // Target mode: new portfolio or updating existing
    const [isNewPortfolio, setIsNewPortfolio] = useState(true);
    const [targetPortfolioId, setTargetPortfolioId] = useState<string>("");
    const [portfolioName, setPortfolioName] = useState("");

    // Advanced targets
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [monthlyContribution, setMonthlyContribution] = useState("500");
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState("");
    const [reinvestDividends, setReinvestDividends] = useState(true);

    const [isSaving, setIsSaving] = useState(false);

    // Initialize symbols and default shares when dialog opens or selection changes
    useEffect(() => {
        if (open) {
            setSymbols(initialSymbols);
            const initialShares: Record<string, string> = {};
            initialSymbols.forEach((sym) => {
                initialShares[sym] = sharesMap[sym] || "10";
            });
            setSharesMap(initialShares);

            const defaultName = `Portfolio - ${new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            })}`;
            setPortfolioName(defaultName);

            if (userPortfolios.length > 0) {
                setTargetPortfolioId(userPortfolios[0].id.toString());
            }
        }
    }, [open, initialSymbols]);

    // Build list of enriched items currently in draft
    const draftAssets = useMemo(() => {
        return symbols.map((sym) => {
            const found = watchlist.find((w) => w.symbol === sym);
            const currentPrice = found?.currentPrice ?? 100;
            const sharesNum = parseFloat(sharesMap[sym] || "0") || 0;
            const positionValue = sharesNum * currentPrice;
            const dividendYield = found?.dividendYield ?? 0;
            const annualDividend = positionValue * dividendYield;

            return {
                symbol: sym,
                sector: found?.sector ?? "—",
                type: found?.type ?? "Stock",
                currentPrice,
                shares: sharesNum,
                positionValue,
                dividendYield,
                annualDividend,
            };
        });
    }, [symbols, watchlist, sharesMap]);

    // Aggregate statistics
    const totalValue = useMemo(
        () => draftAssets.reduce((sum, a) => sum + a.positionValue, 0),
        [draftAssets]
    );

    const totalShares = useMemo(
        () => draftAssets.reduce((sum, a) => sum + a.shares, 0),
        [draftAssets]
    );

    const totalAnnualDividend = useMemo(
        () => draftAssets.reduce((sum, a) => sum + a.annualDividend, 0),
        [draftAssets]
    );

    const weightedDividendYield = useMemo(() => {
        if (totalValue <= 0) return 0;
        return (totalAnnualDividend / totalValue) * 100;
    }, [totalValue, totalAnnualDividend]);

    const handleShareChange = (sym: string, val: string) => {
        setSharesMap((prev) => ({ ...prev, [sym]: val }));
    };

    const handleQuickIncrement = (sym: string, amount: number) => {
        const current = parseFloat(sharesMap[sym] || "0") || 0;
        const next = Math.max(0, current + amount);
        setSharesMap((prev) => ({ ...prev, [sym]: next.toString() }));
    };

    const handleRemoveSymbol = (sym: string) => {
        setSymbols((prev) => prev.filter((s) => s !== sym));
    };

    const handleSave = async () => {
        const nameToUse = isNewPortfolio
            ? portfolioName.trim()
            : userPortfolios.find((p) => p.id === Number(targetPortfolioId))?.name || portfolioName.trim();

        if (!nameToUse) {
            toast.error("Please provide a portfolio name");
            return;
        }

        if (draftAssets.length === 0) {
            toast.error("Please include at least one asset");
            return;
        }

        if (totalShares <= 0) {
            toast.error("Total shares owned must be greater than zero");
            return;
        }

        setIsSaving(true);
        try {
            const assetsPayload = draftAssets.map((a) => ({
                symbol: a.symbol,
                shares: a.shares,
                avgCostBasis: a.currentPrice,
                weight: totalValue > 0 ? a.positionValue / totalValue : 1 / draftAssets.length,
            }));

            const res = await saveManualPortfolio({
                portfolioId: isNewPortfolio ? -1 : Number(targetPortfolioId),
                name: nameToUse,
                assets: assetsPayload,
                monthlyContribution: parseFloat(monthlyContribution) || 0,
                targetMonthlyIncome: parseFloat(targetMonthlyIncome) || 0,
                reinvestDividends,
            });

            if (res.success && res.portfolio) {
                toast.success(`Portfolio "${res.portfolio.name}" created with ${draftAssets.length} assets!`);
                onPortfolioCreated(res.portfolio.id);
                if (onSelectionClear) onSelectionClear();
                onOpenChange(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create portfolio");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-none border border-border/70 bg-card/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-5 border-b border-border/50 bg-muted/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <FolderPlus className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                                    Create Portfolio
                                    <Badge className="text-[9px] font-black uppercase tracking-widest rounded-none bg-primary/20 text-primary border-primary/30">
                                        Manual Allocation
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground font-medium">
                                    Set the number of shares owned for each selected asset to establish your portfolio.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
                    {/* Portfolio Meta: Name & Target */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 border border-border/40 p-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                Portfolio Name
                            </Label>
                            <Input
                                placeholder="e.g. Dividend Income, Tech Growth..."
                                value={portfolioName}
                                onChange={(e) => setPortfolioName(e.target.value)}
                                disabled={!isNewPortfolio}
                                className="h-9 rounded-none bg-background/50 border-border/50 text-sm font-bold"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Destination
                            </Label>
                            {userPortfolios.length > 0 ? (
                                <div className="flex gap-2 items-center">
                                    <Select
                                        value={isNewPortfolio ? "new" : targetPortfolioId}
                                        onValueChange={(val) => {
                                            if (val === "new") {
                                                setIsNewPortfolio(true);
                                            } else {
                                                setIsNewPortfolio(false);
                                                setTargetPortfolioId(val);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-9 rounded-none bg-background/50 border-border/50 text-xs font-bold flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none border-border/60">
                                            <SelectItem value="new" className="text-xs font-bold">
                                                + Create New Portfolio
                                            </SelectItem>
                                            {userPortfolios.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                                                    Update: {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="h-9 px-3 flex items-center text-xs font-bold text-muted-foreground border border-border/40 bg-background/30">
                                    New Portfolio
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Summary Bar: 4 Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/10 border border-border/40 flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                Total Value
                            </span>
                            <span className="text-base font-black font-mono text-foreground mt-0.5">
                                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="p-3 bg-muted/10 border border-border/40 flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                Total Shares
                            </span>
                            <span className="text-base font-black font-mono text-primary mt-0.5">
                                {totalShares.toLocaleString()}
                            </span>
                        </div>
                        <div className="p-3 bg-muted/10 border border-border/40 flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                Est. Annual Dividend
                            </span>
                            <span className="text-base font-black font-mono text-emerald-400 mt-0.5">
                                ${totalAnnualDividend.toFixed(2)}/yr
                            </span>
                        </div>
                        <div className="p-3 bg-muted/10 border border-border/40 flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                Weighted Yield
                            </span>
                            <span className="text-base font-black font-mono text-cyan-400 mt-0.5">
                                {weightedDividendYield.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    {/* Segmented Allocation Bar */}
                    {totalValue > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <PieChart className="w-3 h-3 text-primary" />
                                    Portfolio Weight Distribution
                                </span>
                                <span>{draftAssets.length} Assets</span>
                            </div>
                            <div className="h-2.5 w-full flex overflow-hidden border border-border/40 bg-muted/20">
                                {draftAssets.map((asset, idx) => {
                                    const pct = totalValue > 0 ? (asset.positionValue / totalValue) * 100 : 0;
                                    if (pct <= 0) return null;
                                    const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                                    return (
                                        <div
                                            key={asset.symbol}
                                            style={{ width: `${pct}%` }}
                                            className={`${colorClass} transition-all duration-300 relative group`}
                                            title={`${asset.symbol}: ${pct.toFixed(1)}% ($${asset.positionValue.toFixed(2)})`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Holdings Configuration Table */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                Holdings & Shares Owned ({draftAssets.length})
                            </Label>
                            <span className="text-[10px] text-muted-foreground">
                                Adjust shares below or use quick increment buttons
                            </span>
                        </div>

                        <div className="border border-border/50 divide-y divide-border/30 bg-muted/5">
                            {draftAssets.map((asset, idx) => {
                                const weightPct = totalValue > 0 ? (asset.positionValue / totalValue) * 100 : 0;
                                const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];

                                return (
                                    <div
                                        key={asset.symbol}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 hover:bg-muted/20 transition-colors"
                                    >
                                        {/* Asset Info */}
                                        <div className="flex items-center gap-2.5 w-44 flex-none">
                                            <div className={`w-1.5 h-7 flex-none ${colorClass}`} />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-base italic text-foreground tracking-tight">
                                                        {asset.symbol}
                                                    </span>
                                                    <Badge
                                                        className={`text-[8px] font-bold rounded-none px-1 py-0 border ${
                                                            asset.type === "ETF"
                                                                ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                        }`}
                                                    >
                                                        {asset.type}
                                                    </Badge>
                                                </div>
                                                <span className="text-[10px] font-medium text-muted-foreground uppercase truncate max-w-[120px]">
                                                    {asset.sector}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Market Price */}
                                        <div className="flex flex-col items-start sm:items-end w-24 flex-none">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                Price
                                            </span>
                                            <span className="font-mono font-bold text-xs text-foreground/80">
                                                ${asset.currentPrice.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Shares Input & Quick Increment */}
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={sharesMap[asset.symbol] ?? "0"}
                                                onChange={(e) => handleShareChange(asset.symbol, e.target.value)}
                                                className="w-20 h-8 text-center font-mono font-bold text-xs rounded-none bg-background/50 border-border/50"
                                            />
                                            <div className="flex items-center gap-0.5">
                                                {[1, 5, 10, 50].map((inc) => (
                                                    <button
                                                        key={inc}
                                                        type="button"
                                                        onClick={() => handleQuickIncrement(asset.symbol, inc)}
                                                        className="text-[9px] font-mono font-bold px-1.5 py-1 bg-muted/40 hover:bg-primary/20 hover:text-primary transition-colors border border-border/40"
                                                    >
                                                        +{inc}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Live Value & Weight */}
                                        <div className="flex flex-col items-end w-28 flex-none">
                                            <span className="font-mono font-bold text-xs text-foreground">
                                                ${asset.positionValue.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-primary">
                                                {weightPct.toFixed(1)}%
                                            </span>
                                        </div>

                                        {/* Remove Ticker */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSymbol(asset.symbol)}
                                            disabled={draftAssets.length <= 1}
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none flex-none"
                                            title="Remove from portfolio"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Collapsible Advanced Settings */}
                    <div className="border border-border/40 bg-muted/5">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                Growth & Contribution Settings (Optional)
                            </span>
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showAdvanced && (
                            <div className="p-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Monthly Contribution ($)
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min="0"
                                            value={monthlyContribution}
                                            onChange={(e) => setMonthlyContribution(e.target.value)}
                                            placeholder="500"
                                            className="pl-8 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Target Monthly Income ($)
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min="0"
                                            value={targetMonthlyIncome}
                                            onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                            placeholder="Optional"
                                            className="pl-8 h-8 rounded-none bg-background/50 border-border/50 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1 sm:col-span-2">
                                    <Switch
                                        id="dialog-reinvest"
                                        checked={reinvestDividends}
                                        onCheckedChange={setReinvestDividends}
                                    />
                                    <Label
                                        htmlFor="dialog-reinvest"
                                        className="text-xs font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                        Reinvest dividends automatically in projections
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="rounded-none font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving || draftAssets.length === 0 || totalShares <= 0}
                        className="rounded-none font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5 gap-2 shadow-lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Portfolio...
                            </>
                        ) : (
                            <>
                                <Check className="w-3.5 h-3.5" /> Create & Save Portfolio
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ManualPortfolioDialog;
