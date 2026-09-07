"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PortfolioCandidate, saveOptimizationToPortfolio, getPortfolioCandidates } from "@/lib/actions/assets";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { OptimizedPortfolio } from "@/lib/data-types";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { CopySetupForm } from "./copy-dialog/copy-setup-form";
import { CopyResultsView } from "./copy-dialog/copy-results-view";

interface StrategyCopyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  strategyName: string;
  tickers: string[];
}

export default function StrategyCopyDialog({
  isOpen,
  onOpenChange,
  strategyName,
  tickers,
}: StrategyCopyDialogProps) {
  const { fetchAll } = usePortfolioStore();

  const [portfolioName, setPortfolioName] = React.useState<string>(strategyName);
  const [budget, setBudget] = React.useState<string>("10000");
  const [monthlyContribution, setMonthlyContribution] = React.useState<string>("500");
  const [targetMonthlyIncome, setTargetMonthlyIncome] = React.useState<string>("");
  const [isReinvestDividends, setIsReinvestDividends] = React.useState<boolean>(false);

  const [candidates, setCandidates] = React.useState<PortfolioCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = React.useState<boolean>(false);

  const [isOptimizing, setIsOptimizing] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = React.useState<OptimizedPortfolio | null>(null);

  // Reset state and sync default portfolio name when strategyName or tickers change
  React.useEffect(() => {
    setOptimizationResult(null);
    if (strategyName) {
      setPortfolioName(strategyName);
    }
  }, [strategyName, tickers?.join(",")]);

  // Fetch candidate data when dialog opens or tickers change
  React.useEffect(() => {
    if (isOpen && tickers && tickers.length > 0) {
      let isMounted = true;
      setCandidatesLoading(true);
      getPortfolioCandidates(tickers)
        .then((data) => {
          if (isMounted) {
            setCandidates(data);
            setCandidatesLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Failed to fetch candidates:", err);
            toast.error("Failed to fetch asset data for strategy");
            setCandidatesLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, tickers?.join(",")]);

  // Optimize & calculate target allocation
  const handleOptimize = async () => {
    const totalBudget = parseFloat(budget);
    if (isNaN(totalBudget) || totalBudget <= 0) {
      toast.error("Please enter a valid investment budget");
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
        throw new Error(data.error || "Optimization calculation failed");
      }

      if (data.optimizedPortfolio?.error) {
        toast.error(data.optimizedPortfolio.message || data.optimizedPortfolio.error);
        return;
      }

      if (data.optimizedPortfolio) {
        setOptimizationResult(data.optimizedPortfolio);
      }
    } catch (err: any) {
      toast.error(err.message || "Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Save to user portfolios
  const handleSave = async () => {
    if (!optimizationResult) return;

    const finalName = portfolioName.trim() || strategyName;
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
          name: finalName,
        },
        -1
      );

      toast.success(`Portfolio "${finalName}" successfully created!`);
      onOpenChange(false);
      setOptimizationResult(null);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to save portfolio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setOptimizationResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl w-full rounded-none border-border/60 bg-card/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight italic text-primary">
                Deploy Strategy to Portfolio
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                {strategyName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {!optimizationResult ? (
            <CopySetupForm
              strategyName={strategyName}
              portfolioName={portfolioName}
              setPortfolioName={setPortfolioName}
              budget={budget}
              setBudget={setBudget}
              monthlyContribution={monthlyContribution}
              setMonthlyContribution={setMonthlyContribution}
              targetMonthlyIncome={targetMonthlyIncome}
              setTargetMonthlyIncome={setTargetMonthlyIncome}
              isReinvestDividends={isReinvestDividends}
              setIsReinvestDividends={setIsReinvestDividends}
              tickers={tickers}
              isOptimizing={isOptimizing}
              candidatesLoading={candidatesLoading}
              onOptimize={handleOptimize}
            />
          ) : (
            <CopyResultsView
              optimizationResult={optimizationResult}
              budget={budget}
              monthlyContribution={monthlyContribution}
              portfolioName={portfolioName || strategyName}
              isSaving={isSaving}
              onSave={handleSave}
              onBack={() => setOptimizationResult(null)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
