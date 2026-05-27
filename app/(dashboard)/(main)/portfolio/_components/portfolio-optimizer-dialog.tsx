import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { PortfolioCandidate, saveOptimizationToPortfolio } from "@/lib/actions/assets";
import { Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OptimizedPortfolio } from "@/lib/data-types";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import AutoOptimizer from "./manual/auto-optimizer";
import BudgetInput from "./manual/budget-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualInput from "./manual/manual-input";
import ManualResults from "./manual/manual-results";

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

    // Manual optimizer states
    const [manualResult, setManualResult] = useState<any | null>(null);
    const [isCalculatingManual, setIsCalculatingManual] = useState(false);
    const [manualContribution, setManualContribution] = useState(500);
    const [manualTargetMonthlyIncome, setManualTargetMonthlyIncome] = useState(0);
    const [manualIsNewPortfolio, setManualIsNewPortfolio] = useState(false);

    const handleManualCalculate = async (data: {
        shares: Record<string, number>;
        monthlyContribution: number;
        targetMonthlyIncome: number;
        reinvestDividends: boolean;
        isNewPortfolio: boolean;
    }) => {
        setIsCalculatingManual(true);
        setManualResult(null);
        setManualContribution(data.monthlyContribution);
        setManualTargetMonthlyIncome(data.targetMonthlyIncome);
        setManualIsNewPortfolio(data.isNewPortfolio);

        try {
            const formattedCandidates = candidates.map(c => ({
                symbol: c.symbol,
                total_return: c.total_return * 100,
                beta: c.beta,
                asset_type: c.asset_type,
                dividend_yield: c.dividend_yield
            }));

            const sharesArray = candidates.map(c => data.shares[c.symbol] ?? 0);

            const reqBody: any = {
                candidates: formattedCandidates,
                shares: sharesArray,
                reinvest_dividend: data.reinvestDividends
            };

            if (data.monthlyContribution > 0) {
                reqBody.monthly_contribution = data.monthlyContribution;
            }
            if (data.targetMonthlyIncome > 0) {
                reqBody.target_monthly_income = data.targetMonthlyIncome;
            }

            const res = await fetch("/api/portfolio/calculate-projections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const result = await res.json();
            if (result.success) {
                setManualResult(result);
            } else {
                toast.error(result.error || "Projections calculation failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to calculate projections");
        } finally {
            setIsCalculatingManual(false);
        }
    };

    const handleManualSave = async () => {
        if (!manualResult) return;
        setIsSaving(true);
        try {
            const tickers = Object.keys(manualResult.shares);
            const weights: Record<string, number> = {};
            tickers.forEach(symbol => {
                const value = (manualResult.shares[symbol] ?? 0) * (manualResult.prices[symbol] ?? 0);
                weights[symbol] = manualResult.initial_portfolio_value > 0 ? value / manualResult.initial_portfolio_value : 0;
            });

            const projections = Object.entries(manualResult.milestones).map(([year, val]: [string, any]) => ({
                year: parseInt(year),
                value: val.portfolio_value,
                income: val.monthly_income * 12
            }));

            const metrics = {
                expected_return: manualResult.portfolio_weighted_return / 100,
                dividend_yield: manualResult.portfolio_weighted_yield / 100,
                volatility: 0,
                sharpe_ratio: 0,
                target_monthly_income: manualTargetMonthlyIncome,
            };

            await saveOptimizationToPortfolio({
                tickers,
                shares: manualResult.shares,
                prices: manualResult.prices,
                weights,
                projections,
                metrics,
                name: `Manual_Portfolio_${Date.now() / 1000}`
            }, manualIsNewPortfolio ? -1 : portfolio_id);

            toast.success("Manual portfolio saved! Assets updated as OWNED.");
            setDialogOpen(false);
            setManualResult(null);
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to save portfolio");
        } finally {
            setIsSaving(false);
            fetchAll();
        }
    };

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
                name: `Optimized_Portfolio_${Date.now() / 1000}`
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setOptimizationResult(null); setLastOptimizedBudget(null); setManualResult(null); } }}>
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
                <Tabs defaultValue="auto" className="w-full">
                    <TabsList>
                        <TabsTrigger value="auto">Auto</TabsTrigger>
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auto">
                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-muted-foreground bg-primary/5 border-l-2 border-primary/40 px-3 py-2 leading-relaxed">
                                💡 <strong>Automated Optimizer:</strong> Automatically distribute your investment capital across watchlist candidates to mathematically maximize expected returns and compound efficiency.
                            </p>
                            {/* Budget input */}
                            {!optimizationResult && (
                                <BudgetInput
                                    budget={budget}
                                    setBudget={setBudget}
                                    monthlyContribution={monthlyContribution}
                                    setMonthlyContribution={setMonthlyContribution}
                                    targetMonthlyIncome={targetMonthlyIncome}
                                    setTargetMonthlyIncome={setTargetMonthlyIncome}
                                    isReinvestDividends={isReinvestDividends}
                                    setIsReinvestDividends={setIsReinvestDividends}
                                    isNewPortfolio={isNewPortfolio}
                                    setIsNewPortfolio={setIsNewPortfolio}
                                    handleOptimize={handleOptimize}
                                    isOptimizing={isOptimizing}
                                    candidatesLoading={candidatesLoading}
                                    lastOptimizedBudget={lastOptimizedBudget}
                                    candidates={candidates}
                                />
                            )}

                            {/* Results */}
                            {optimizationResult && (
                                <AutoOptimizer
                                    optimizationResult={optimizationResult}
                                    budget={budget}
                                    monthlyContribution={monthlyContribution}
                                    setOptimizationResult={setOptimizationResult}
                                    handleSave={handleSave}
                                    isSaving={isSaving}
                                />
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="manual">
                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <p className="text-xs text-muted-foreground bg-primary/5 border-l-2 border-primary/40 px-3 py-2 leading-relaxed">
                                💡 <strong>Manual Simulator:</strong> Enter custom share quantities for each of your assets to calculate precise allocations, run custom dividend yield models, and simulate 30-year growth milestones.
                            </p>
                            {!manualResult ? (
                                <ManualInput
                                    candidates={candidates}
                                    candidatesLoading={candidatesLoading}
                                    isCalculating={isCalculatingManual}
                                    onCalculate={handleManualCalculate}
                                />
                            ) : (
                                <ManualResults
                                    result={manualResult}
                                    monthlyContribution={manualContribution}
                                    targetMonthlyIncome={manualTargetMonthlyIncome}
                                    onReset={() => setManualResult(null)}
                                    onSave={handleManualSave}
                                    isSaving={isSaving}
                                />
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

            </DialogContent>
        </Dialog>
    );
};

export default PortfolioOptimizerDialog;