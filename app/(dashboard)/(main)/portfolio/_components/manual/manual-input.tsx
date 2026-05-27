"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PortfolioCandidate } from "@/lib/actions/assets";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, DollarSign, Loader2, Play } from "lucide-react";

interface ManualInputProps {
    candidates: PortfolioCandidate[];
    candidatesLoading: boolean;
    isCalculating: boolean;
    onCalculate: (data: {
        shares: Record<string, number>;
        monthlyContribution: number;
        targetMonthlyIncome: number;
        reinvestDividends: boolean;
        isNewPortfolio: boolean;
    }) => void;
}

const ManualInput = ({ candidates, candidatesLoading, isCalculating, onCalculate }: ManualInputProps) => {
    const [shares, setShares] = useState<Record<string, string>>(() => {
        const initialShares: Record<string, string> = {};
        candidates.forEach(c => {
            initialShares[c.symbol] = "10"; // default to 10 shares
        });
        return initialShares;
    });

    const [monthlyContribution, setMonthlyContribution] = useState("500");
    const [targetMonthlyIncome, setTargetMonthlyIncome] = useState("");
    const [isReinvestDividends, setIsReinvestDividends] = useState(true);
    const [isNewPortfolio, setIsNewPortfolio] = useState(false);

    const handleShareChange = (symbol: string, val: string) => {
        setShares(prev => ({
            ...prev,
            [symbol]: val
        }));
    };

    const handleSubmit = () => {
        const sharesMap: Record<string, number> = {};
        candidates.forEach(c => {
            const val = parseFloat(shares[c.symbol] || "0");
            sharesMap[c.symbol] = isNaN(val) ? 0 : val;
        });

        onCalculate({
            shares: sharesMap,
            monthlyContribution: parseFloat(monthlyContribution) || 0,
            targetMonthlyIncome: parseFloat(targetMonthlyIncome) || 0,
            reinvestDividends: isReinvestDividends,
            isNewPortfolio: isNewPortfolio
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">1. Specify Shares for Each Asset</h3>
                <div className="border border-border/50 overflow-hidden bg-card/20">
                    {/* Header Row */}
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/20 border-b border-border/40">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20 flex-none">Ticker</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-1">Details</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-28 text-right flex-none">Expected Return</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24 text-right flex-none">Dividend Yield</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-24 text-center flex-none">Shares Count</span>
                    </div>

                    {candidatesLoading ? (
                        <div className="p-8 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Loading candidates data...</span>
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground uppercase tracking-widest">
                            No watchlist assets found. Please add symbols to your watchlist.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {candidates.map((c) => (
                                <div key={c.symbol} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors">
                                    <div className="w-20 flex-none flex items-center gap-2">
                                        <span className="font-black text-base italic text-primary">{c.symbol}</span>
                                        <Badge
                                            className={`text-[8px] font-bold rounded-none px-1 py-0 border ${c.asset_type === 'etf'
                                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}
                                        >
                                            {c.asset_type.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 text-xs text-muted-foreground truncate">
                                        Beta: {c.beta.toFixed(2)}
                                    </div>
                                    <div className="w-28 flex-none text-right font-mono font-bold text-sm text-foreground">
                                        {c.total_return != null ? `${(c.total_return * 100).toFixed(2)}%` : "—"}
                                    </div>
                                    <div className="w-24 flex-none text-right font-mono font-bold text-sm text-foreground">
                                        {c.dividend_yield != null ? `${(c.dividend_yield).toFixed(2)}%` : "—"}
                                    </div>
                                    <div className="w-24 flex-none flex justify-center">
                                        <Input
                                            type="number"
                                            value={shares[c.symbol] ?? "0"}
                                            onChange={(e) => handleShareChange(c.symbol, e.target.value)}
                                            className="h-8 rounded-none bg-background/50 border-border/50 text-center font-mono font-bold text-sm w-20 px-1"
                                            min="0"
                                            step="any"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">2. Growth & Income Target Settings</h3>
                <div className="grid grid-cols-2 gap-4 bg-card/20 border border-border/50 p-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Contribution</label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(e.target.value)}
                                className="pl-8 h-9 rounded-none bg-background/50 border-border/50 font-mono text-sm"
                                placeholder="500"
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Monthly Income</label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                type="number"
                                value={targetMonthlyIncome}
                                onChange={(e) => setTargetMonthlyIncome(e.target.value)}
                                className="pl-8 h-9 rounded-none bg-background/50 border-border/50 font-mono text-sm"
                                placeholder="Optional"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Switch
                            id="manual-reinvest"
                            checked={isReinvestDividends}
                            onCheckedChange={setIsReinvestDividends}
                        />
                        <Label htmlFor="manual-reinvest" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                            Reinvest Dividends
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Switch
                            id="manual-new-portfolio"
                            checked={isNewPortfolio}
                            onCheckedChange={setIsNewPortfolio}
                        />
                        <Label htmlFor="manual-new-portfolio" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                            Create as new Portfolio
                        </Label>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={isCalculating || candidatesLoading || candidates.length === 0}
                className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-11 gap-2"
            >
                {isCalculating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Calculating Projections...</>
                ) : (
                    <><Play className="w-4 h-4 fill-current" /> Calculate Projections</>
                )}
            </Button>
        </div>
    );
};

export default ManualInput;
