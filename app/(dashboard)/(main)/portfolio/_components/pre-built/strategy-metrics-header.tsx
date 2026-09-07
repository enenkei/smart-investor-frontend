"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Strategy, StrategyTheme, StrategyMode } from "./types";
import { StrategyHoldingDetail } from "@/lib/actions/strategies";
import { TrendingUp, ShieldAlert, DollarSign, Award, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyMetricsHeaderProps {
  strategy: Strategy;
  theme: StrategyTheme;
  mode: StrategyMode;
  holdings: StrategyHoldingDetail[];
}

export function StrategyMetricsHeader({
  strategy,
  theme,
  mode,
  holdings,
}: StrategyMetricsHeaderProps) {
  // Calculate weighted dividend yield from holdings
  const weightedYield = React.useMemo(() => {
    if (!holdings || holdings.length === 0 || !strategy.weights) return 0;
    let totalYield = 0;
    let totalWeight = 0;
    for (const h of holdings) {
      const weight = strategy.weights[h.ticker] || 0;
      totalYield += h.dividend_yield * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? totalYield / totalWeight : 0;
  }, [holdings, strategy.weights]);

  // Calculate average quality score
  const avgScore = React.useMemo(() => {
    if (!holdings || holdings.length === 0) return 0.8;
    const sum = holdings.reduce((acc, h) => acc + h.score, 0);
    return (sum / holdings.length) * 100;
  }, [holdings]);

  // Volatility risk label
  const riskLabel = strategy.expected_volatility < 0.11 ? "Low Risk" : strategy.expected_volatility < 0.16 ? "Moderate Risk" : "Aggressive Risk";
  const riskColor = strategy.expected_volatility < 0.11 ? "text-emerald-500" : strategy.expected_volatility < 0.16 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="flex flex-col gap-4">
      {/* Title & Badges Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/10 border border-border/40 p-4 rounded-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase italic">
              {strategy.display_name}
            </h2>
            <Badge className="bg-primary/10 text-primary border border-primary/30 uppercase text-[10px] font-bold tracking-wider">
              {mode.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{theme.tagline}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border/60">
            {strategy.slug}
          </Badge>
          <span className="text-[11px] text-muted-foreground/80">
            Updated: {new Date(strategy.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Expected Return */}
        <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Exp. Return
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-500 flex items-baseline gap-1">
              +{(strategy.expected_return * 100).toFixed(2)}%
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
              Annualized model target <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </CardContent>
        </Card>

        {/* Metric 2: Expected Volatility */}
        <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Exp. Volatility
              </span>
              <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
              {(strategy.expected_volatility * 100).toFixed(2)}%
            </div>
            <span className={cn("text-[10px] font-semibold mt-1", riskColor)}>
              {riskLabel}
            </span>
          </CardContent>
        </Card>

        {/* Metric 3: Portfolio Dividend Yield */}
        <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Div. Yield
              </span>
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-amber-500">
              {weightedYield.toFixed(2)}%
            </div>
            <span className="text-[10px] text-muted-foreground mt-1">
              Weighted basket cash flow
            </span>
          </CardContent>
        </Card>

        {/* Metric 4: Composite Quality Score */}
        <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardContent className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Basket Score
              </span>
              <Award className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
              {avgScore.toFixed(0)} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1">
              Top-Tier Quantitative Rank
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
