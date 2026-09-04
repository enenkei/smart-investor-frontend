"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Coins,
  TrendingUp,
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Snowflake,
  Flame,
  Clock,
  DollarSign,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { getTickerForComparison } from "@/controllers/stock-data-controller";
import {
  analyzeDividendSnowball,
} from "@/controllers/ai-controller";
import { toast } from "sonner";

interface DividendSnowballDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTicker?: string;
  initialYield?: number;
  initialDivCagr?: number;
}

export interface YearSnapshot {
  year: number;
  portfolioValue: number;
  totalContributed: number;
  annualDividends: number;
  monthlyDividends: number;
  yieldOnCostPct: number;
  cumulativeDividends: number;
  reinvestedGains: number;
  isCrossover: boolean;
}

export function DividendSnowballDialog({
  open,
  onOpenChange,
  initialTicker,
  initialYield,
  initialDivCagr,
}: DividendSnowballDialogProps) {
  // Simulator Parameters
  const [tickerSymbol, setTickerSymbol] = React.useState(initialTicker || "SCHD");
  const [startingPrincipal, setStartingPrincipal] = React.useState(10000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);
  const [dividendYieldPct, setDividendYieldPct] = React.useState(
    initialYield != null ? (initialYield <= 1 && initialYield > 0 ? initialYield * 100 : initialYield) : 3.5
  );
  const [dividendGrowthRatePct, setDividendGrowthRatePct] = React.useState(
    initialDivCagr != null ? initialDivCagr : 7.5
  );
  const [priceGrowthRatePct, setPriceGrowthRatePct] = React.useState(5.0);
  const [years, setYears] = React.useState(20);
  const [dripEnabled, setDripEnabled] = React.useState(true);
  const [targetMonthlyIncome, setTargetMonthlyIncome] = React.useState(2000);

  const [activeTab, setActiveTab] = React.useState<"capital" | "income">("capital");
  const [showSchedule, setShowSchedule] = React.useState(false);

  // AI Coaching State
  const [analyzing, setAnalyzing] = React.useState(false);
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(null);

  // Load ticker defaults when opened with initialTicker
  React.useEffect(() => {
    if (open) {
      if (initialYield != null) {
        const y = initialYield <= 1 && initialYield > 0 ? Number((initialYield * 100).toFixed(2)) : Number(initialYield.toFixed(2));
        setDividendYieldPct(y);
        if (y > 10) {
          setPriceGrowthRatePct(-8.0);
          setDividendGrowthRatePct(0);
        }
      }
      if (initialDivCagr != null) {
        setDividendGrowthRatePct(Number(initialDivCagr.toFixed(2)));
      }
      if (initialTicker) {
        setTickerSymbol(initialTicker);
        fetchTickerStats(initialTicker);
      } else if (initialYield == null && initialDivCagr == null) {
        // Defaults to SCHD
        setTickerSymbol("SCHD");
        setDividendYieldPct(3.5);
        setDividendGrowthRatePct(7.5);
        setPriceGrowthRatePct(5.0);
      }
    }
  }, [open, initialTicker, initialYield, initialDivCagr]);

  const fetchTickerStats = async (sym: string) => {
    const item = await getTickerForComparison(sym);
    if (item) {
      if (item.divYield != null) {
        const y = item.divYield <= 1 && item.divYield > 0 ? item.divYield * 100 : item.divYield;
        setDividendYieldPct(Number(y.toFixed(2)));
        // For ultra-high yield funds (>10%, e.g. FEPI, JEPI, covered calls), set realistic assumptions
        if (y > 10) {
          setPriceGrowthRatePct(-8.0);
          setDividendGrowthRatePct(0);
        }
      }
      if (item.divCagr5y != null) {
        setDividendGrowthRatePct(Number(item.divCagr5y.toFixed(2)));
      }
    }
  };

  const handleApplyPreset = (preset: {
    symbol: string;
    yield: number;
    divGrowth: number;
    appreciation: number;
  }) => {
    setTickerSymbol(preset.symbol);
    setDividendYieldPct(preset.yield);
    setDividendGrowthRatePct(preset.divGrowth);
    setPriceGrowthRatePct(preset.appreciation);
    setAiAnalysis(null);
  };

  // Math: Industry-Standard Compounding Simulation
  // For traditional equities: models share accumulation & dividend per share CAGR
  // For covered-call / option funds (>10% yield): distributions track current NAV to prevent unphysical compound runaway
  const simulation = React.useMemo(() => {
    const schedule: YearSnapshot[] = [];
    
    // Normalized base share price ($100 makes simulation intuitive and scale-independent)
    let sharePrice = 100;
    let sharesOwned = startingPrincipal > 0 ? startingPrincipal / sharePrice : 0;
    let annualDividendPerShare = sharePrice * (dividendYieldPct / 100);
    
    let totalContributed = startingPrincipal;
    let cumulativeDividends = 0;
    let crossoverYear: number | null = null;
    const annualOutofPocket = monthlyContribution * 12;

    const isHighYieldFund = dividendYieldPct > 10;
    const monthlyPriceGrowthRate = Math.pow(1 + Math.max(-0.95, priceGrowthRatePct / 100), 1 / 12) - 1;
    const annualDivGrowthMultiplier = 1 + Math.max(-0.95, dividendGrowthRatePct / 100);

    for (let y = 1; y <= years; y++) {
      if (y > 1 && !isHighYieldFund) {
        annualDividendPerShare *= annualDivGrowthMultiplier;
      }

      let annualDivForYear = 0;

      for (let m = 1; m <= 12; m++) {
        // High yield option funds distribute a % of current NAV; traditional dividend stocks pay per-share payout
        const currentMonthlyDivPerShare = isHighYieldFund
          ? (sharePrice * (dividendYieldPct / 100)) / 12
          : annualDividendPerShare / 12;

        const monthlyDiv = sharesOwned * currentMonthlyDivPerShare;
        annualDivForYear += monthlyDiv;
        cumulativeDividends += monthlyDiv;

        // 2. Out-of-pocket monthly contribution
        totalContributed += monthlyContribution;

        // 3. Cash deployed into purchasing shares at current market price
        const cashToInvest = monthlyContribution + (dripEnabled ? monthlyDiv : 0);
        if (cashToInvest > 0 && sharePrice > 0) {
          sharesOwned += cashToInvest / sharePrice;
        }

        // 4. Share price moves over the month (appreciation or NAV decay)
        sharePrice *= 1 + monthlyPriceGrowthRate;
      }

      // End-of-year metrics
      const portfolioValue = sharesOwned * sharePrice;
      const currentRunRateDivPerShare = isHighYieldFund
        ? sharePrice * (dividendYieldPct / 100)
        : annualDividendPerShare;
      const runRateAnnualDividends = sharesOwned * currentRunRateDivPerShare;
      const runRateMonthlyDividends = runRateAnnualDividends / 12;

      // Check crossover milestone: annual dividend run-rate >= annual personal out-of-pocket savings
      const isCrossover = annualOutofPocket > 0 
        ? runRateAnnualDividends >= annualOutofPocket 
        : true;

      if (isCrossover && crossoverYear === null && annualOutofPocket > 0) {
        crossoverYear = y;
      }

      // Yield on Cost = Run-rate annual dividend / Total cumulative out-of-pocket cash invested
      const yieldOnCost = totalContributed > 0 ? (runRateAnnualDividends / totalContributed) * 100 : 0;
      const reinvestedGains = Math.max(0, portfolioValue - totalContributed);

      schedule.push({
        year: y,
        portfolioValue: Math.round(portfolioValue),
        totalContributed: Math.round(totalContributed),
        annualDividends: Math.round(runRateAnnualDividends),
        monthlyDividends: Math.round(runRateMonthlyDividends),
        yieldOnCostPct: Number(yieldOnCost.toFixed(2)),
        cumulativeDividends: Math.round(cumulativeDividends),
        reinvestedGains: Math.round(reinvestedGains),
        isCrossover,
      });
    }

    const last = schedule[schedule.length - 1] || {
      portfolioValue: 0,
      annualDividends: 0,
      monthlyDividends: 0,
      yieldOnCostPct: 0,
    };

    // Calculate Non-DRIP Benchmark to determine DRIP bonus capital
    let nonDripSharePrice = 100;
    let nonDripShares = startingPrincipal > 0 ? startingPrincipal / nonDripSharePrice : 0;
    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        if (monthlyContribution > 0 && nonDripSharePrice > 0) {
          nonDripShares += monthlyContribution / nonDripSharePrice;
        }
        nonDripSharePrice *= 1 + monthlyPriceGrowthRate;
      }
    }
    const nonDripFinalValue = nonDripShares * nonDripSharePrice;
    const dripBonusCapital = Math.max(0, last.portfolioValue - Math.round(nonDripFinalValue));

    return {
      schedule,
      crossoverYear,
      finalPortfolioValue: last.portfolioValue,
      finalAnnualDividends: last.annualDividends,
      finalMonthlyDividends: last.monthlyDividends,
      finalYieldOnCost: last.yieldOnCostPct,
      totalContributed,
      cumulativeDividends: Math.round(cumulativeDividends),
      dripBonusCapital,
    };
  }, [
    startingPrincipal,
    monthlyContribution,
    dividendYieldPct,
    dividendGrowthRatePct,
    priceGrowthRatePct,
    years,
    dripEnabled,
  ]);

  const handleRunAiCoach = async () => {
    setAnalyzing(true);
    const res = await analyzeDividendSnowball({
      tickerSymbol,
      startingPrincipal,
      monthlyContribution,
      initialYieldPct: dividendYieldPct,
      annualDivGrowthPct: dividendGrowthRatePct,
      annualAppreciationPct: priceGrowthRatePct,
      years,
      dripEnabled,
      targetMonthlyIncome,
      finalPortfolioValue: simulation.finalPortfolioValue,
      finalAnnualDividends: simulation.finalAnnualDividends,
      finalMonthlyDividends: simulation.finalMonthlyDividends,
      crossoverYear: simulation.crossoverYear,
      yieldOnCostPct: simulation.finalYieldOnCost,
      totalContributed: simulation.totalContributed,
      totalDividendsEarned: simulation.cumulativeDividends,
    });
    setAnalyzing(false);

    if (res.ok && res.data) {
      setAiAnalysis(res.data);
    } else {
      toast.error(res.error || "Coaching analysis failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border/60 rounded-xl shadow-2xl p-6 sm:p-8 custom-scrollbar">
        <DialogHeader className="border-b border-border/50 pb-4">
          <DialogTitle className="flex items-center justify-between text-xl font-black uppercase tracking-tight text-primary">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Snowflake className="w-5 h-5 text-emerald-400" />
              </div>
              <span>Dividend Snowball & DRIP Simulator</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
              Long-Term Compounding Engine
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Presets & Ticker Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Asset / Presets:
            </span>
            <div className="flex items-center gap-1.5">
              <Input
                value={tickerSymbol}
                onChange={(e) => setTickerSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. FEPI, SCHD"
                className="h-7 w-24 text-xs font-mono font-bold uppercase bg-background/50 border-border/60"
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchTickerStats(tickerSymbol);
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2.5 text-xs font-bold"
                onClick={() => fetchTickerStats(tickerSymbol)}
              >
                Load
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset({ symbol: "SCHD", yield: 3.5, divGrowth: 8.5, appreciation: 5.0 })}
              className="text-xs font-bold h-7 px-2.5 border-border/60 hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              🏆 SCHD (3.5% Div Growth)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset({ symbol: "VOO", yield: 1.4, divGrowth: 6.5, appreciation: 7.5 })}
              className="text-xs font-bold h-7 px-2.5 border-border/60 hover:bg-primary/10 hover:text-primary"
            >
              📈 VOO (1.4% Index)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset({ symbol: "JEPI", yield: 7.5, divGrowth: 2.0, appreciation: 2.0 })}
              className="text-xs font-bold h-7 px-2.5 border-border/60 hover:bg-amber-500/10 hover:text-amber-400"
            >
              💵 JEPI (7.5% Income)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset({ symbol: "FEPI", yield: 25.0, divGrowth: 0.0, appreciation: -8.0 })}
              className="text-xs font-bold h-7 px-2.5 border-border/60 hover:bg-rose-500/10 hover:text-rose-400"
            >
              🔥 FEPI (25% Yield, -8% NAV Decay)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset({ symbol: "O", yield: 5.2, divGrowth: 3.5, appreciation: 3.0 })}
              className="text-xs font-bold h-7 px-2.5 border-border/60 hover:bg-indigo-500/10 hover:text-indigo-400"
            >
              🏢 Realty Income (5.2% Monthly)
            </Button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background/40 rounded-xl border border-border/50">
          {/* Column 1: Capital Inputs */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Starting Principal:</span>
                <span className="font-mono font-bold text-foreground">
                  ${startingPrincipal.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[startingPrincipal]}
                min={1000}
                max={250000}
                step={1000}
                onValueChange={([v]) => { setStartingPrincipal(v); setAiAnalysis(null); }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Monthly Contribution:</span>
                <span className="font-mono font-bold text-primary">
                  ${monthlyContribution.toLocaleString()}/mo
                </span>
              </div>
              <Slider
                value={[monthlyContribution]}
                min={0}
                max={5000}
                step={50}
                onValueChange={([v]) => { setMonthlyContribution(v); setAiAnalysis(null); }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Investment Horizon:</span>
                <span className="font-mono font-bold text-foreground">{years} Years</span>
              </div>
              <Slider
                value={[years]}
                min={5}
                max={30}
                step={1}
                onValueChange={([v]) => { setYears(v); setAiAnalysis(null); }}
              />
            </div>
          </div>

          {/* Column 2: Return Rates */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Current Dividend Yield:</span>
                <span className="font-mono font-bold text-emerald-400">{dividendYieldPct.toFixed(2)}%</span>
              </div>
              <Slider
                value={[dividendYieldPct]}
                min={0.5}
                max={40.0}
                step={0.1}
                onValueChange={([v]) => {
                  setDividendYieldPct(v);
                  if (v > 10 && priceGrowthRatePct > 0) {
                    setPriceGrowthRatePct(-8.0);
                    setDividendGrowthRatePct(0);
                  }
                  setAiAnalysis(null);
                }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Annual Dividend Growth (CAGR):</span>
                <span className={cn("font-mono font-bold", dividendGrowthRatePct < 0 ? "text-amber-400" : "text-foreground")}>
                  {dividendGrowthRatePct > 0 ? `+${dividendGrowthRatePct.toFixed(1)}%` : `${dividendGrowthRatePct.toFixed(1)}%`}
                </span>
              </div>
              <Slider
                value={[dividendGrowthRatePct]}
                min={-15.0}
                max={20.0}
                step={0.5}
                onValueChange={([v]) => { setDividendGrowthRatePct(v); setAiAnalysis(null); }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Expected Price Growth:</span>
                <span className={cn("font-mono font-bold", priceGrowthRatePct < 0 ? "text-amber-400" : "text-foreground")}>
                  {priceGrowthRatePct > 0 ? `+${priceGrowthRatePct.toFixed(1)}%` : `${priceGrowthRatePct.toFixed(1)}%`}
                  {priceGrowthRatePct < 0 ? " (NAV Decay)" : ""}
                </span>
              </div>
              <Slider
                value={[priceGrowthRatePct]}
                min={-20.0}
                max={15.0}
                step={0.5}
                onValueChange={([v]) => { setPriceGrowthRatePct(v); setAiAnalysis(null); }}
              />
            </div>

            {/* Implied Total Return Bar */}
            <div className="pt-0.5 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-semibold">Implied Total Return:</span>
              <span className={cn("font-mono font-bold", (dividendYieldPct + priceGrowthRatePct) > 20 ? "text-rose-400" : "text-emerald-400")}>
                {(dividendYieldPct + priceGrowthRatePct) > 0 ? `+${(dividendYieldPct + priceGrowthRatePct).toFixed(1)}%` : `${(dividendYieldPct + priceGrowthRatePct).toFixed(1)}%`} / yr
              </span>
            </div>
          </div>

          {/* Column 3: DRIP & Target Goal */}
          <div className="space-y-3.5 flex flex-col justify-between bg-muted/10 p-3 rounded-lg border border-border/40">
            {/* DRIP Switch */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">DRIP Reinvestment</span>
                <span className="text-[10px] text-muted-foreground">
                  Automatically buy more shares with dividends
                </span>
              </div>
              <Switch
                checked={dripEnabled}
                onCheckedChange={(c) => { setDripEnabled(c); setAiAnalysis(null); }}
              />
            </div>

            {/* Income Goal Target */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-muted-foreground">Target Monthly Income:</span>
                <span className="font-mono font-black text-amber-400">
                  ${targetMonthlyIncome.toLocaleString()}/mo
                </span>
              </div>
              <Slider
                value={[targetMonthlyIncome]}
                min={500}
                max={50000}
                step={250}
                onValueChange={([v]) => { setTargetMonthlyIncome(v); setAiAnalysis(null); }}
              />
            </div>

            {/* Run AI Analysis Button */}
            <Button
              size="sm"
              onClick={handleRunAiCoach}
              disabled={analyzing}
              className="w-full h-8 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Strategy Coaching</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* High-Yield / Option ETF Reality Check Banner */}
        {dividendYieldPct > 10 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200 animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300">High-Yield Option Strategy (Yield &gt; 10%):</span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Covered-call ETFs (FEPI, CONY, QYLD) sell equity upside to pay out option premiums, which naturally leads to NAV erosion (-5% to -12%/yr). Modeling positive price growth creates unrealistic exponential projections.
                </p>
              </div>
            </div>
            {priceGrowthRatePct >= 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPriceGrowthRatePct(-8.0);
                  setDividendGrowthRatePct(0.0);
                }}
                className="shrink-0 h-7 text-[11px] px-2.5 border-amber-500/40 hover:bg-amber-500/20 text-amber-300 font-bold"
              >
                Apply Realistic NAV Decay (-8%)
              </Button>
            )}
          </div>
        )}

        {/* Live Scorecard KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Value */}
          <div className="p-3.5 rounded-lg bg-background/50 border border-border/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Projected Portfolio Value
            </span>
            <span className="text-xl font-black font-mono text-foreground tracking-tight">
              ${simulation.finalPortfolioValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Out of Pocket: ${simulation.totalContributed.toLocaleString()}
            </span>
          </div>

          {/* Monthly Income */}
          <div className="p-3.5 rounded-lg bg-background/50 border border-border/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Monthly Passive Income
            </span>
            <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
              ${simulation.finalMonthlyDividends.toLocaleString()}/mo
            </span>
            <span className="text-[10px] text-muted-foreground block">
              ${simulation.finalAnnualDividends.toLocaleString()} / year
            </span>
          </div>

          {/* Yield on Cost */}
          <div className="p-3.5 rounded-lg bg-background/50 border border-border/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Effective Yield on Cost
            </span>
            <span className="text-xl font-black font-mono text-primary tracking-tight">
              {simulation.finalYieldOnCost}%
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Annual Dividends ÷ Cash Saved
            </span>
          </div>

          {/* The Crossover Point */}
          <div className="p-3.5 rounded-lg bg-background/50 border border-border/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              The Crossover Point
            </span>
            {simulation.crossoverYear ? (
              <>
                <span className="text-xl font-black font-mono text-amber-400 tracking-tight flex items-center gap-1">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Year {simulation.crossoverYear}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  Dividends surpass personal savings!
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-muted-foreground block pt-1">
                  Horizon too short
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Increase time or contribution
                </span>
              </>
            )}
          </div>
        </div>

        {/* AI Coaching Assessment (if available) */}
        {aiAnalysis && (
          <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-background/40 to-background border border-emerald-500/30 shadow-xl animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  AI Financial Independence Assessment
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {aiAnalysis.status}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {aiAnalysis.executiveSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-background/50 border border-border/40 space-y-1">
                <span className="font-bold text-primary uppercase text-[10px] tracking-wider block">
                  Crossover & DRIP Power
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {aiAnalysis.crossoverMilestoneInsight}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40 space-y-1">
                <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                  Snowball Acceleration Levers
                </span>
                <ul className="list-disc pl-3 text-muted-foreground space-y-1 marker:text-amber-400">
                  {aiAnalysis.accelerationLevers?.map((lev: string, i: number) => (
                    <li key={i}>{lev}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Growth Visualizer (Recharts) */}
        <div className="bg-background/40 p-4 rounded-xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Compounding Trajectory ({years} Years)
              </span>
            </div>

            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs">
              <button
                onClick={() => setActiveTab("capital")}
                className={cn(
                  "px-3 py-1 rounded font-bold transition-all text-xs",
                  activeTab === "capital"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Capital Growth ($)
              </button>
              <button
                onClick={() => setActiveTab("income")}
                className={cn(
                  "px-3 py-1 rounded font-bold transition-all text-xs",
                  activeTab === "income"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly Income ($)
              </button>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "capital" ? (
                <AreaChart
                  data={simulation.schedule}
                  margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                >
                  <defs>
                    <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(v) => `Yr ${v}`}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(v) => {
                      if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                      if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                      return `$${v}`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as YearSnapshot;
                      return (
                        <div className="bg-popover/95 border border-border/60 p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">Year {item.year}</p>
                          <p className="text-emerald-400 font-mono font-bold">
                            Total Value: ${item.portfolioValue.toLocaleString()}
                          </p>
                          <p className="text-indigo-400 font-mono">
                            Out of Pocket: ${item.totalContributed.toLocaleString()}
                          </p>
                          <p className="text-muted-foreground font-mono">
                            Reinvested/Gains: ${item.reinvestedGains.toLocaleString()}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="portfolioValue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#valGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalContributed"
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    fill="url(#contribGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={simulation.schedule}
                  margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(v) => `Yr ${v}`}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickFormatter={(v) => {
                      if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                      if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                      return `$${v}`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as YearSnapshot;
                      return (
                        <div className="bg-popover/95 border border-border/60 p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">Year {item.year}</p>
                          <p className="text-emerald-400 font-mono font-bold">
                            Monthly Income: ${item.monthlyDividends.toLocaleString()}/mo
                          </p>
                          <p className="text-muted-foreground font-mono">
                            Annual Payout: ${item.annualDividends.toLocaleString()}/yr
                          </p>
                          <p className="text-primary font-mono">
                            Yield on Cost: {item.yieldOnCostPct}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={targetMonthlyIncome}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Target Goal: $${targetMonthlyIncome.toLocaleString()}/mo`,
                      fill: "#f59e0b",
                      fontSize: 10,
                      position: "top",
                    }}
                  />
                  <Bar
                    dataKey="monthlyDividends"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collapsible Year-by-Year Schedule */}
        <div className="border border-border/50 rounded-xl overflow-hidden bg-background/30">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-muted/20"
          >
            <span>Full Year-by-Year Amortization Schedule</span>
            <span className="text-[10px] font-mono text-primary">
              {showSchedule ? "Hide Table ▲" : "View Full Schedule ▼"}
            </span>
          </button>

          {showSchedule && (
            <div className="overflow-x-auto max-h-60 custom-scrollbar divide-y divide-border/20 text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Portfolio Value</th>
                    <th className="py-2 px-3">Monthly Div</th>
                    <th className="py-2 px-3">Annual Div</th>
                    <th className="py-2 px-3">Yield on Cost</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {simulation.schedule.map((row) => (
                    <tr
                      key={row.year}
                      className={cn(
                        "hover:bg-muted/20 transition-colors",
                        row.isCrossover && "bg-amber-500/5"
                      )}
                    >
                      <td className="py-1.5 px-3 font-bold">Yr {row.year}</td>
                      <td className="py-1.5 px-3">${row.portfolioValue.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-emerald-400 font-bold">
                        ${row.monthlyDividends.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3">${row.annualDividends.toLocaleString()}</td>
                      <td className="py-1.5 px-3 text-primary">{row.yieldOnCostPct}%</td>
                      <td className="py-1.5 px-3 text-[10px]">
                        {row.isCrossover ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Crossover 🔥
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">Accumulating</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
