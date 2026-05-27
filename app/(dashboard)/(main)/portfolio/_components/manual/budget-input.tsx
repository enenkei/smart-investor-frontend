import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PortfolioCandidate } from "@/lib/actions/assets";
import { DollarSign, Loader2, Zap } from "lucide-react";

type Props = {
    budget: string;
    monthlyContribution: string;
    setBudget: (budget: string) => void;
    setMonthlyContribution: (monthlyContribution: string) => void;
    targetMonthlyIncome: string;
    setTargetMonthlyIncome: (targetMonthlyIncome: string) => void;
    isReinvestDividends: boolean;
    setIsReinvestDividends: (isReinvestDividends: boolean) => void;
    isNewPortfolio: boolean;
    setIsNewPortfolio: (isNewPortfolio: boolean) => void;
    handleOptimize: () => void;
    isOptimizing: boolean;
    candidatesLoading: boolean;
    lastOptimizedBudget: string | null;
    candidates: PortfolioCandidate[];
}

const BudgetInput = (props: Props) => {
    const {
        budget,
        monthlyContribution,
        setBudget,
        setMonthlyContribution,
        targetMonthlyIncome,
        setTargetMonthlyIncome,
        isReinvestDividends,
        setIsReinvestDividends,
        isNewPortfolio,
        setIsNewPortfolio,
        handleOptimize,
        isOptimizing,
        candidatesLoading,
        lastOptimizedBudget,
        candidates
    } = props;
    return (
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
    )
}

export default BudgetInput;