"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, Zap, FolderPlus, Layers } from "lucide-react";

interface CopySetupFormProps {
  strategyName: string;
  portfolioName: string;
  setPortfolioName: (name: string) => void;
  budget: string;
  setBudget: (val: string) => void;
  monthlyContribution: string;
  setMonthlyContribution: (val: string) => void;
  targetMonthlyIncome: string;
  setTargetMonthlyIncome: (val: string) => void;
  isReinvestDividends: boolean;
  setIsReinvestDividends: (val: boolean) => void;
  tickers: string[];
  isOptimizing: boolean;
  candidatesLoading: boolean;
  onOptimize: () => void;
}

export function CopySetupForm({
  strategyName,
  portfolioName,
  setPortfolioName,
  budget,
  setBudget,
  monthlyContribution,
  setMonthlyContribution,
  targetMonthlyIncome,
  setTargetMonthlyIncome,
  isReinvestDividends,
  setIsReinvestDividends,
  tickers,
  isOptimizing,
  candidatesLoading,
  onOptimize,
}: CopySetupFormProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Portfolio Custom Name */}
      <div className="space-y-1.5 bg-background/40 border border-border/40 p-3.5 rounded-none">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <FolderPlus className="w-3.5 h-3.5 text-primary" />
            Portfolio Name
          </Label>
          <span className="text-[10px] text-muted-foreground">Will be saved under this name</span>
        </div>
        <Input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          placeholder={strategyName}
          className="rounded-none bg-background/70 border-border/60 font-bold text-sm h-10"
        />
      </div>

      {/* Grid: Budget & Contribution & Optional Income */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Starting Capital */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Initial Capital Budget ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
              placeholder="10000"
              min="100"
            />
          </div>
          <span className="text-[10px] text-muted-foreground">Total cash to allocate across holdings</span>
        </div>

        {/* Monthly Contribution */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Monthly Contribution ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
              placeholder="500"
              min="0"
            />
          </div>
          <span className="text-[10px] text-muted-foreground">Recurring monthly savings input</span>
        </div>

        {/* Target Monthly Income */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Target Monthly Income ($) <span className="text-muted-foreground/60 font-normal">(Optional)</span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={targetMonthlyIncome}
              onChange={(e) => setTargetMonthlyIncome(e.target.value)}
              className="pl-9 rounded-none bg-background/50 border-border/50 font-mono font-bold text-sm h-10"
              placeholder="e.g. 1000"
              min="0"
            />
          </div>
          <span className="text-[10px] text-muted-foreground">Computes timeline to reach dividend target</span>
        </div>

        {/* Reinvest Dividends Toggle */}
        <div className="flex flex-col justify-between p-3 bg-background/40 border border-border/40 rounded-none">
          <div className="flex items-center justify-between">
            <Label htmlFor="reinvest-switch" className="text-xs uppercase font-bold tracking-wider cursor-pointer">
              Reinvest Dividends (DRIP)
            </Label>
            <Switch
              id="reinvest-switch"
              checked={isReinvestDividends}
              onCheckedChange={setIsReinvestDividends}
            />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">
            Compound dividend income automatically to accelerate long-term wealth growth
          </span>
        </div>
      </div>

      {/* Strategy Tickers Preview */}
      <div className="p-3.5 bg-background/30 border border-border/40 rounded-none space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Strategy Holdings ({tickers.length} Assets)
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            Equal / Rank Factor Weights
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tickers.map((ticker) => (
            <Badge
              key={ticker}
              variant="outline"
              className="font-mono text-xs font-bold px-2 py-0.5 rounded-none border-border/60 bg-muted/20"
            >
              {ticker}
            </Badge>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onOptimize}
        disabled={isOptimizing || candidatesLoading || tickers.length === 0}
        className="w-full rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-12 gap-2 text-xs shadow-md"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Simulating Portfolio Allocations & Projections...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Calculate Target Shares & Performance
          </>
        )}
      </Button>
    </div>
  );
}
