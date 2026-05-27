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
    ArrowRight, 
    Award, 
    CheckCircle2, 
    Scale,
    DollarSign,
    Percent,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { saveOptimizationToPortfolio } from "@/lib/actions/assets";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface RebuildResult {
    success: boolean;
    rebalance_recommended: boolean;
    message: string;
    current_portfolio: {
        health_score: number;
        metrics: {
            return_1y: number;
            volatility_1y: number;
            sharpe_ratio: number;
            max_drawdown: number;
            current_monthly_income: number;
        };
    };
    rebalanced_portfolio: {
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
    result: RebuildResult | null;
    portfolioId: number;
    portfolioName: string;
}

const SuggestRebuildDialog = ({ open, onOpenChange, result, portfolioId, portfolioName }: SuggestRebuildDialogProps) => {
    const { fetchUserPortfolios, fetchUserAssets } = usePortfolioStore();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    if (!result) return null;

    const { rebalance_recommended, message, current_portfolio, rebalanced_portfolio } = result;

    const handleApplyRebalance = async () => {
        setIsSaving(true);
        try {
            // Construct data payload to match saveOptimizationToPortfolio expectations
            const tickers = Object.keys(rebalanced_portfolio.holdings);
            const shares: Record<string, number> = {};
            const prices: Record<string, number> = {};
            const weights: Record<string, number> = {};

            tickers.forEach(t => {
                const h = rebalanced_portfolio.holdings[t];
                shares[t] = h.shares;
                prices[t] = h.price;
                weights[t] = h.weight;
            });

            // Simulated compound projections mapping
            const mockProjections = Array.from({ length: 31 }, (_, i) => ({
                year: i,
                portfolio_value: 0,
                cumulative_contributions: 0,
                monthly_income: rebalanced_portfolio.metrics.monthly_income
            }));

            await saveOptimizationToPortfolio({
                tickers,
                shares,
                prices,
                weights,
                projections: mockProjections,
                metrics: {
                    sharpe_ratio: rebalanced_portfolio.metrics.sharpe_ratio,
                    expected_return: rebalanced_portfolio.metrics.expected_return,
                    expected_volatility: rebalanced_portfolio.metrics.volatility,
                    dividend_yield: rebalanced_portfolio.metrics.dividend_yield
                },
                name: portfolioName
            }, portfolioId);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                                <Scale className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligent Rebalancing</span>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-foreground">
                                    Rebuild Portfolio: {portfolioName}
                                </DialogTitle>
                            </div>
                        </div>
                        <Badge className={`rounded-none font-black uppercase tracking-widest text-[9px] px-2 py-0.5 border ${
                            rebalance_recommended 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                            {rebalance_recommended ? "Rebalance Recommended" : "Excellent Health"}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Glowing Alert Status Card */}
                    <div className={`border p-4 flex items-start gap-4 ${
                        rebalance_recommended 
                        ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' 
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                    }`}>
                        {rebalance_recommended ? (
                            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                        )}
                        <div className="space-y-1">
                            <span className="font-black text-sm uppercase tracking-wider">
                                {rebalance_recommended ? "Sub-Optimal Allocation Found" : "Holdings in Peak Alignment"}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Side-by-Side Current vs Rebalanced Comparison Grid */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Portfolio Rebuild Diagnostics</span>
                        <div className="grid grid-cols-5 gap-3">
                            <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Health Score</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-black font-mono text-muted-foreground/60">{current_portfolio.health_score.toFixed(0)}</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                    <span className="text-lg font-black font-mono text-emerald-400">85+</span>
                                </div>
                            </div>
                            <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Exp. Return</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-black font-mono text-muted-foreground/60">{current_portfolio.metrics.return_1y.toFixed(1)}%</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                    <span className="text-lg font-black font-mono text-emerald-400">{rebalanced_portfolio.metrics.expected_return.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Volatility</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-black font-mono text-muted-foreground/60">{current_portfolio.metrics.volatility_1y.toFixed(1)}%</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                    <span className="text-lg font-black font-mono text-violet-400">{rebalanced_portfolio.metrics.volatility.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Sharpe Ratio</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-black font-mono text-muted-foreground/60">{current_portfolio.metrics.sharpe_ratio.toFixed(2)}</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                    <span className="text-lg font-black font-mono text-foreground">{rebalanced_portfolio.metrics.sharpe_ratio.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="border border-border/50 bg-card/20 p-3 flex flex-col justify-between h-20">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Mo. Income</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-black font-mono text-muted-foreground/60">${current_portfolio.metrics.current_monthly_income.toFixed(0)}</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 mx-1" />
                                    <span className="text-lg font-black font-mono text-amber-400">${rebalanced_portfolio.metrics.monthly_income.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rebalanced Holdings Table */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Intelligent Rebalanced Allocation</span>
                        <div className="border border-border/50 overflow-hidden bg-card/10">
                            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-muted/20 border-b border-border/40 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Asset Ticker</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Price</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Suggested Shares</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">Target Weight</span>
                            </div>
                            <div className="divide-y divide-border/30 max-h-56 overflow-y-auto custom-scrollbar">
                                {Object.entries(rebalanced_portfolio.holdings).map(([symbol, h]) => (
                                    <div key={symbol} className="grid grid-cols-4 gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm italic text-primary">{symbol}</span>
                                        </div>
                                        <span className="text-right font-mono text-xs font-medium text-muted-foreground">
                                            ${h.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                </div>

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
                        disabled={isSaving || !rebalance_recommended}
                    >
                        {isSaving ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rebalancing...</>
                        ) : (
                            <><Scale className="w-3.5 h-3.5" /> Execute Rebalance & Save</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SuggestRebuildDialog;
