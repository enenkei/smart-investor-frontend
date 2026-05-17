"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PortfolioCandidate, saveOptimizationToPortfolio, getPortfolioCandidates } from "@/lib/actions/assets";
import { Activity, BookmarkCheck, ChevronLeft, DollarSign, Loader2, Target, TrendingUp, Zap, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { OptimizedPortfolio } from "@/lib/data-types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";

type Props = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    strategyName: string;
    tickers: string[];
}

const StrategyCopyDialog = ({ isOpen, onOpenChange, strategyName, tickers }: Props) => {
    const router = useRouter();
    const { fetchAll } = usePortfolioStore();

    const [budget, setBudget] = useState("10000");
    const [monthlyContribution, setMonthlyContribution] = useState("500");
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState("");
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isReinvestDividends, setIsReinvestDividends] = useState(false);
    const [candidates, setCandidates] = useState<PortfolioCandidate[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<OptimizedPortfolio | null>(null);
    const [lastOptimizedBudget, setLastOptimizedBudget] = useState<string | null>(null);

    // Fetch candidate data when dialog opens
    useEffect(() => {
        if (isOpen && tickers.length > 0) {
            const fetchData = async () => {
                setCandidatesLoading(true);
                try {
                    const data = await getPortfolioCandidates(tickers);
                    setCandidates(data);
                } catch (err) {
                    toast.error("Failed to fetch asset data");
                } finally {
                    setCandidatesLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, tickers]);

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

            const res = await fetch("/api/portfolio/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Optimization failed");
            }

            if (data.optimizedPortfolio?.error) {
                toast.error(data.optimizedPortfolio.message || data.optimizedPortfolio.error);
                return;
            }

            if (data.optimizedPortfolio) {
                setOptimizationResult(data.optimizedPortfolio);
                setLastOptimizedBudget(budget);
            }
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
            await saveOptimizationToPortfolio({
                tickers: optimizationResult.tickers,
                shares: optimizationResult.shares,
                prices: optimizationResult.prices,
                weights: optimizationResult.weights,
                projections: optimizationResult.projections,
                metrics: optimizationResult.metrics,
                name: strategyName, // Save strategy name as portfolio name
            }, -1); // Always create a new portfolio for strategy copy

            toast.success(`Strategy "${strategyName}" saved to your portfolios!`);
            onOpenChange(false);
            setOptimizationResult(null);
            fetchAll();
        } catch (err: any) {
            toast.error(err.message || "Failed to save portfolio");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) { setOptimizationResult(null); setLastOptimizedBudget(null); } }}>
            <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                            <Copy className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight italic text-primary">Copy Pre-built Strategy</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                                Initialize your portfolio with {strategyName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {!optimizationResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investment Budget</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
                                            placeholder="10000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Contribution</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={monthlyContribution}
                                            onChange={(e) => setMonthlyContribution(e.target.value)}
                                            className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
                                            placeholder="500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Mo. Income (Optional)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={targetMonthlyIncome}
                                            onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                            className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <Switch
                                        id="reinvest-strategy"
                                        checked={isReinvestDividends}
                                        onCheckedChange={setIsReinvestDividends}
                                    />
                                    <Label htmlFor="reinvest-strategy" className="text-xs uppercase font-bold tracking-wider">Reinvest Dividends</Label>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Strategy Tickers</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {tickers.map(ticker => (
                                        <div key={ticker} className="px-2 py-1 bg-muted/30 border border-border/50 font-mono text-[10px] font-bold">
                                            {ticker}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleOptimize}
                                disabled={isOptimizing || candidatesLoading || tickers.length < 2}
                                className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-12 gap-2"
                            >
                                {isOptimizing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Strategy...</>
                                ) : (
                                    <><Zap className="w-4 h-4" /> Preview Performance</>
                                )}
                            </Button>
                        </div>
                    )}

                    {optimizationResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <TrendingUp className="w-4 h-4" />, label: "Exp. Return", value: `${(optimizationResult.metrics.expected_return * 100).toFixed(2)}%`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                                    { icon: <Activity className="w-4 h-4" />, label: "Volatility", value: `${(optimizationResult.metrics.volatility * 100).toFixed(2)}%`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                                    { icon: <Target className="w-4 h-4" />, label: "Sharpe Ratio", value: optimizationResult.metrics.sharpe_ratio.toFixed(3), color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                                ].map(m => (
                                    <div key={m.label} className={`border ${m.bg} p-3 flex flex-col gap-1`}>
                                        <div className={`flex items-center gap-1.5 ${m.color}`}>{m.icon}<span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span></div>
                                        <span className={`text-xl font-black font-mono ${m.color}`}>{m.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Projections Chart */}
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
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setOptimizationResult(null)}
                                    disabled={isSaving}
                                    className="flex-1 rounded-none border-border/50 font-bold text-xs uppercase tracking-widest"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Adjust Setup
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Copying...</>
                                    ) : (
                                        <><BookmarkCheck className="w-3.5 h-3.5" /> Save to My Portfolio</>
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

export default StrategyCopyDialog;
