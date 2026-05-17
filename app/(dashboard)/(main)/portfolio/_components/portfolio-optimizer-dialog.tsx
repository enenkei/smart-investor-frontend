import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PortfolioCandidate, saveOptimizationToPortfolio } from "@/lib/actions/assets";
import { Activity, BookmarkCheck, ChevronLeft, DollarSign, Loader2, Target, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { OptimizedPortfolio } from "@/lib/data-types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";

type Props = {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    candidates: PortfolioCandidate[];
    candidatesLoading: boolean;
    optimizationResult: OptimizedPortfolio | null;
    setOptimizationResult: (result: OptimizedPortfolio | null) => void;
    portfolio_id: number;
}

const PortfolioOptimizerDialog = (props: Props) => {
    const { dialogOpen, setDialogOpen, candidates, candidatesLoading, optimizationResult, setOptimizationResult, portfolio_id } = props;
    const router = useRouter();

    const [budget, setBudget] = useState("10000");
    const [monthlyContribution, setMonthlyContribution] = useState("500");
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState("");
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastOptimizedBudget, setLastOptimizedBudget] = useState<string | null>(null);
    const [isReinvestDividends, setIsReinvestDividends] = useState(false);
    const [isNewPortfolio, setIsNewPortfolio] = useState(false);
    const { fetchAll } = usePortfolioStore();

    const handleOptimize = async () => {
        const totalBudget = parseFloat(budget);
        if (isNaN(totalBudget) || totalBudget <= 0) {
            toast.error("Enter a valid budget");
            return;
        }
        setIsOptimizing(true);
        setOptimizationResult(null);
        try {
            const reqBody: any = {
                candidates,
                total_budget: totalBudget,
            };
            if (monthlyContribution) {
                reqBody.monthly_contribution = parseFloat(monthlyContribution);
            }
            if (targetMonthlyIncome) {
                reqBody.target_monthly_income = parseFloat(targetMonthlyIncome);
            }
            reqBody.reinvest_dividend = isReinvestDividends;
            // console.log("reqBody", reqBody);
            const res = await fetch("/api/portfolio/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
            });

            const responseText = await res.text();
            let data;
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

            if (data.optimizedPortfolio?.error) {
                toast.error(data.optimizedPortfolio.message || data.optimizedPortfolio.error);
                return;
            }
            // console.log('data.optimizedPortfolio', data.optimizedPortfolio);
            if (data.optimizedPortfolio) {
                setOptimizationResult(data.optimizedPortfolio);
                setLastOptimizedBudget(budget);
            } else {
                toast.error(data.error || "Optimization failed");
                return;
            }
        } catch (err: any) {
            toast.error(err.message || "Optimization failed");
            return;
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSave = async () => {
        if (!optimizationResult) return;
        setIsSaving(true);
        try {
            // console.log("isNewPortfolio", isNewPortfolio);
            await saveOptimizationToPortfolio({
                tickers: optimizationResult.tickers,
                shares: optimizationResult.shares,
                prices: optimizationResult.prices,
                weights: optimizationResult.weights,
                projections: optimizationResult.projections,
                metrics: optimizationResult.metrics,
            }, isNewPortfolio ? -1 : portfolio_id);
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setOptimizationResult(null); setLastOptimizedBudget(null); } }}>
            <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight italic text-primary">Portfolio Optimizer</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                                AI-driven allocation across your assets
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Budget input */}
                    {!optimizationResult && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div className="relative flex-col gap-1 flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Investment Budget</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-8"
                                            placeholder="10000"
                                            min="100"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Monthly Contrib.</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={monthlyContribution}
                                            onChange={(e) => setMonthlyContribution(e.target.value)}
                                            className="pl-6 rounded-none bg-background/50 border-border/50 font-mono text-sm h-8"
                                            placeholder="500"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 w-36">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Target Mo. Income</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={targetMonthlyIncome}
                                            onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                            className="pl-6 rounded-none bg-background/50 border-border/50 font-mono text-sm h-8"
                                            placeholder="Optional"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="relative flex items-center gap-2">
                                            <Switch
                                                id="reinvest-dividends"
                                                checked={isReinvestDividends}
                                                onCheckedChange={setIsReinvestDividends}
                                                className="rounded-full bg-background/50 border-border/50 font-mono text-sm h-8"
                                            />
                                            <Label htmlFor="reinvest-dividends">Reinvest Dividends</Label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="relative flex items-center gap-2">
                                            <Switch
                                                id="new-portfolio"
                                                checked={isNewPortfolio}
                                                onCheckedChange={setIsNewPortfolio}
                                                className="rounded-full bg-background/50 border-border/50 font-mono text-sm h-8"
                                            />
                                            <Label htmlFor="new-portfolio">Create a new Portfolio</Label>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleOptimize}
                                    disabled={isOptimizing || candidatesLoading || candidates.length < 2 || budget === lastOptimizedBudget}
                                    className="rounded-none col-span-2 w-1/2 mx-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-11 px-6 gap-2"
                                >
                                    {isOptimizing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Optimizing...</>
                                    ) : (
                                        <><Zap className="w-4 h-4" /> Optimize</>
                                    )}
                                </Button>
                            </div>
                            {/* Candidate summary */}
                            <div className="flex items-center gap-2 pt-1">
                                {candidatesLoading ? (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading asset data...
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        <span className="text-foreground font-bold">{candidates.length}</span> assets with fundamental data found
                                        {candidates.length < 2 && <span className="text-amber-400 ml-2">— need at least 2 to optimize</span>}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {optimizationResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            {/* Metric cards */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    {
                                        icon: <TrendingUp className="w-4 h-4" />,
                                        label: "Expected Return",
                                        value: `${(optimizationResult.metrics.expected_return * 100).toFixed(2)}%`,
                                        color: "text-emerald-400",
                                        bg: "bg-emerald-500/10 border-emerald-500/20"
                                    },
                                    {
                                        icon: <Activity className="w-4 h-4" />,
                                        label: "Volatility",
                                        value: `${(optimizationResult.metrics.volatility * 100).toFixed(2)}%`,
                                        color: "text-amber-400",
                                        bg: "bg-amber-500/10 border-amber-500/20"
                                    },
                                    {
                                        icon: <Target className="w-4 h-4" />,
                                        label: "Sharpe Ratio",
                                        value: optimizationResult.metrics.sharpe_ratio.toFixed(3),
                                        color: "text-violet-400",
                                        bg: "bg-violet-500/10 border-violet-500/20"
                                    },
                                ].map(m => (
                                    <div key={m.label} className={`border ${m.bg} p-3 flex flex-col gap-1`}>
                                        <div className={`flex items-center gap-1.5 ${m.color}`}>{m.icon}<span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span></div>
                                        <span className={`text-xl font-black font-mono ${m.color}`}>{m.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Allocation table */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Allocation for ${budget}</p>
                                <div className="border border-border/50 overflow-hidden">
                                    {/* Header row */}
                                    <div className="flex items-center gap-4 px-4 py-2 bg-muted/20 border-b border-border/40">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-16 flex-none">Ticker</span>
                                        <div className="flex-1" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-14 text-right flex-none">Weight</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-16 text-right flex-none">Shares</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 text-right flex-none">Price</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 text-right flex-none">Alloc.</span>
                                    </div>
                                    {[...optimizationResult.tickers]
                                        .sort((a, b) => (optimizationResult.weights[b] ?? 0) - (optimizationResult.weights[a] ?? 0))
                                        .map((ticker) => {
                                            const weight = optimizationResult.weights[ticker] ?? 0;
                                            const price = optimizationResult.prices?.[ticker];
                                            const sharesCount = optimizationResult.shares?.[ticker];
                                            const dollars = weight * parseFloat(budget || "10000");
                                            return (
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
                                                        {sharesCount != null ? sharesCount : "—"}
                                                    </span>
                                                    <span className="font-mono text-xs text-muted-foreground w-20 text-right flex-none">
                                                        {price != null ? `$${price.toFixed(2)}` : "—"}
                                                    </span>
                                                    <span className="font-mono text-xs text-muted-foreground w-20 text-right flex-none">
                                                        ${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Projections Chart */}
                            {optimizationResult.projections.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">30-Year Projections based on ${budget} starting capital, monthly contribution of ${monthlyContribution}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border border-border/50 p-4 bg-card/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">Portfolio Value</p>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={optimizationResult.projections}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="year" stroke="#4927F5" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                                                        <YAxis stroke="#4927F5" fontSize={10} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: "#E2DC32", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontFamily: "monospace" }}
                                                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Value"]}
                                                            labelFormatter={(label) => `Year ${label}`}
                                                        />
                                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="border border-border/50 p-4 bg-card/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-4">Annual Income</p>
                                            <div className="h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={optimizationResult.projections}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="year" stroke="#12AA59" fontSize={10} tickFormatter={(v) => `Yr ${v}`} />
                                                        <YAxis stroke="#12AA59" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: "#C4C4C4", border: "1px solid rgba(255,255,255,0.2)", fontSize: "12px", fontFamily: "monospace" }}
                                                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Income"]}
                                                            labelFormatter={(label) => `Year ${label}`}
                                                        />
                                                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {optimizationResult.metrics.requirements_to_target && Object.keys(optimizationResult.metrics.requirements_to_target).length > 0 && (
                                        <div className="border border-border/50 p-4 bg-card/50 mt-4">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                                                Required Monthly Contribution to Hit Target Income
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                {Object.entries(optimizationResult.metrics.requirements_to_target).map(([year, req]) => (
                                                    <div key={year} className="border border-border/40 bg-muted/10 p-2 flex flex-col items-center justify-center text-center">
                                                        <span className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Year {year}</span>
                                                        <span className={`font-mono text-xs font-bold ${req === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {req === 0 ? 'Funded' : `$${req.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-muted-foreground mt-2 opacity-70">
                                                * Estimated monthly investment needed to reach target capital by the specified year. 'Funded' means your starting capital compounding alone is sufficient.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}



                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => { setOptimizationResult(null); }}
                                    disabled={isSaving}
                                    className="flex-1 rounded-none border-border/50 font-bold text-xs uppercase tracking-widest hover:bg-muted/30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Adjust Budget
                                </Button>
                                <Button
                                    onClick={handleSave}
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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PortfolioOptimizerDialog;