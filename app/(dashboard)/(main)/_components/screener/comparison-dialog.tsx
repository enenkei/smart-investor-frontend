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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftRight,
  Sparkles,
  Trophy,
  Loader2,
  Scale,
  Plus,
  Compass,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ComparisonItem,
  getTickerForComparison,
  searchTickersForComparison,
  addToWatchlist,
} from "@/controllers/stock-data-controller";
import {
  compareTickersHeadToHead,
  InvestmentGoal,
} from "@/controllers/ai-controller";
import { toast } from "sonner";

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbolA?: string;
  initialSymbolB?: string;
}

interface ComparisonResult {
  winner: string;
  confidenceLevel: "High" | "Moderate" | "Low";
  executiveSummary: string;
  advantagesA: string[];
  advantagesB: string[];
  keyTradeoff: string;
  portfolioRecommendation: string;
  winnerMetricsHighlight: string[];
}

export function ComparisonDialog({
  open,
  onOpenChange,
  initialSymbolA,
  initialSymbolB,
}: ComparisonDialogProps) {
  const [symbolAInput, setSymbolAInput] = React.useState(initialSymbolA || "VOO");
  const [symbolBInput, setSymbolBInput] = React.useState(initialSymbolB || "SCHD");

  const [suggestionsA, setSuggestionsA] = React.useState<any[]>([]);
  const [suggestionsB, setSuggestionsB] = React.useState<any[]>([]);
  const [showSuggestionsA, setShowSuggestionsA] = React.useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = React.useState(false);

  const [dataA, setDataA] = React.useState<ComparisonItem | null>(null);
  const [dataB, setDataB] = React.useState<ComparisonItem | null>(null);
  const [loadingA, setLoadingA] = React.useState(false);
  const [loadingB, setLoadingB] = React.useState(false);

  const [investmentGoal, setInvestmentGoal] = React.useState<InvestmentGoal>(
    "Long-Term Compounding"
  );
  const [analyzing, setAnalyzing] = React.useState(false);
  const [duelResult, setDuelResult] = React.useState<ComparisonResult | null>(null);

  // Load initial symbols when opened or changed
  React.useEffect(() => {
    if (open) {
      const symA = initialSymbolA || symbolAInput || "VOO";
      const symB = initialSymbolB || symbolBInput || "SCHD";
      setSymbolAInput(symA);
      setSymbolBInput(symB);
      fetchTickerA(symA);
      fetchTickerB(symB);
    }
  }, [open, initialSymbolA, initialSymbolB]);

  const fetchTickerA = async (sym: string) => {
    if (!sym) return;
    setLoadingA(true);
    setDuelResult(null);
    const item = await getTickerForComparison(sym);
    setDataA(item);
    setLoadingA(false);
  };

  const fetchTickerB = async (sym: string) => {
    if (!sym) return;
    setLoadingB(true);
    setDuelResult(null);
    const item = await getTickerForComparison(sym);
    setDataB(item);
    setLoadingB(false);
  };

  // Search autocomplete for A
  React.useEffect(() => {
    if (!symbolAInput || symbolAInput.trim().length === 0) {
      setSuggestionsA([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchTickersForComparison(symbolAInput);
      setSuggestionsA(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [symbolAInput]);

  // Search autocomplete for B
  React.useEffect(() => {
    if (!symbolBInput || symbolBInput.trim().length === 0) {
      setSuggestionsB([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchTickersForComparison(symbolBInput);
      setSuggestionsB(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [symbolBInput]);

  const handleSwap = () => {
    const tempSym = symbolAInput;
    const tempData = dataA;
    setSymbolAInput(symbolBInput);
    setDataA(dataB);
    setSymbolBInput(tempSym);
    setDataB(tempData);
    setDuelResult(null);
  };

  const handleRunDuel = async () => {
    if (!dataA || !dataB) {
      toast.error("Please load two valid tickers to compare.");
      return;
    }

    setAnalyzing(true);
    const res = await compareTickersHeadToHead({
      tickerA: dataA,
      tickerB: dataB,
      investmentGoal,
    });
    setAnalyzing(false);

    if (res.ok && res.data) {
      setDuelResult(res.data as ComparisonResult);
    } else {
      toast.error(res.error || "Duel evaluation failed");
    }
  };

  const handleAddWatchlist = async (sym: string) => {
    const res = await addToWatchlist(sym);
    if (res.success) {
      toast.success(`${sym} added to Watchlist`);
      window.dispatchEvent(new Event("watchlist-updated"));
    } else {
      toast.error(res.error || `Failed to add ${sym}`);
    }
  };

  // Metric Comparison Helper
  const renderMetricRow = (
    label: string,
    valA: number | null | undefined,
    valB: number | null | undefined,
    formatter: (val: number) => string,
    preferHigher: boolean = true
  ) => {
    const hasA = valA !== null && valA !== undefined && !isNaN(valA);
    const hasB = valB !== null && valB !== undefined && !isNaN(valB);

    let winner = 0; // 1 for A, 2 for B, 0 for tie/na
    if (hasA && hasB) {
      if (valA! > valB!) winner = preferHigher ? 1 : 2;
      else if (valB! > valA!) winner = preferHigher ? 2 : 1;
    }

    return (
      <div className="grid grid-cols-12 py-2 px-3 hover:bg-muted/20 items-center border-b border-border/30 text-xs transition-colors">
        <div className="col-span-4 font-medium text-muted-foreground">{label}</div>
        <div
          className={cn(
            "col-span-4 text-center font-mono font-semibold",
            winner === 1 ? "text-emerald-500 font-bold" : "text-foreground"
          )}
        >
          {hasA ? (
            <span className={cn(winner === 1 && "bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20")}>
              {formatter(valA!)}
            </span>
          ) : (
            <span className="text-muted-foreground/40 font-normal">-</span>
          )}
        </div>
        <div
          className={cn(
            "col-span-4 text-center font-mono font-semibold",
            winner === 2 ? "text-emerald-500 font-bold" : "text-foreground"
          )}
        >
          {hasB ? (
            <span className={cn(winner === 2 && "bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20")}>
              {formatter(valB!)}
            </span>
          ) : (
            <span className="text-muted-foreground/40 font-normal">-</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border/60 rounded-xl shadow-2xl p-6 sm:p-8 custom-scrollbar">
        <DialogHeader className="border-b border-border/50 pb-4">
          <DialogTitle className="flex items-center justify-between text-xl font-black uppercase tracking-tight text-primary">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <span>Head-to-Head Ticker Duel</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 bg-primary/5 text-primary border-primary/20">
              AI Quantitative Arbitrator
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Ticker Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center pt-2">
          {/* Slot A */}
          <div className="md:col-span-5 relative">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 block">
              Asset A (Benchmark / Anchor)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={symbolAInput}
                  onChange={(e) => {
                    setSymbolAInput(e.target.value.toUpperCase());
                    setShowSuggestionsA(true);
                  }}
                  onFocus={() => setShowSuggestionsA(true)}
                  placeholder="e.g. VOO, MSFT"
                  className="font-mono uppercase font-bold text-sm bg-background/50 border-border/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowSuggestionsA(false);
                      fetchTickerA(symbolAInput);
                    }
                  }}
                />
                {showSuggestionsA && suggestionsA.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border/60 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestionsA.map((item) => (
                      <div
                        key={item.symbol}
                        className="px-3 py-2 hover:bg-accent/40 cursor-pointer flex items-center justify-between text-xs"
                        onClick={() => {
                          setSymbolAInput(item.symbol);
                          setShowSuggestionsA(false);
                          fetchTickerA(item.symbol);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-primary">{item.symbol}</span>
                          <span className="text-muted-foreground truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                          {item.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="font-bold text-xs"
                onClick={() => {
                  setShowSuggestionsA(false);
                  fetchTickerA(symbolAInput);
                }}
                disabled={loadingA}
              >
                {loadingA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Load"}
              </Button>
            </div>
            {dataA && (
              <div className="mt-1.5 flex items-center justify-between px-2.5 py-1.5 bg-background/40 rounded border border-border/30 text-xs">
                <div className="truncate mr-2">
                  <span className="font-bold text-foreground mr-1.5">{dataA.symbol}</span>
                  <span className="text-muted-foreground text-[11px] truncate">{dataA.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono shrink-0">
                  {dataA.price ? `$${dataA.price.toFixed(2)}` : dataA.sectorOrClass}
                </Badge>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-9 h-9 border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-primary transition-all"
              onClick={handleSwap}
              title="Swap Tickers"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Slot B */}
          <div className="md:col-span-5 relative">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 block">
              Asset B (Challenger / Target)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={symbolBInput}
                  onChange={(e) => {
                    setSymbolBInput(e.target.value.toUpperCase());
                    setShowSuggestionsB(true);
                  }}
                  onFocus={() => setShowSuggestionsB(true)}
                  placeholder="e.g. SCHD, AAPL"
                  className="font-mono uppercase font-bold text-sm bg-background/50 border-border/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowSuggestionsB(false);
                      fetchTickerB(symbolBInput);
                    }
                  }}
                />
                {showSuggestionsB && suggestionsB.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border/60 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestionsB.map((item) => (
                      <div
                        key={item.symbol}
                        className="px-3 py-2 hover:bg-accent/40 cursor-pointer flex items-center justify-between text-xs"
                        onClick={() => {
                          setSymbolBInput(item.symbol);
                          setShowSuggestionsB(false);
                          fetchTickerB(item.symbol);
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-primary">{item.symbol}</span>
                          <span className="text-muted-foreground truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                          {item.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="font-bold text-xs"
                onClick={() => {
                  setShowSuggestionsB(false);
                  fetchTickerB(symbolBInput);
                }}
                disabled={loadingB}
              >
                {loadingB ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Load"}
              </Button>
            </div>
            {dataB && (
              <div className="mt-1.5 flex items-center justify-between px-2.5 py-1.5 bg-background/40 rounded border border-border/30 text-xs">
                <div className="truncate mr-2">
                  <span className="font-bold text-foreground mr-1.5">{dataB.symbol}</span>
                  <span className="text-muted-foreground text-[11px] truncate">{dataB.name}</span>
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono shrink-0">
                  {dataB.price ? `$${dataB.price.toFixed(2)}` : dataB.sectorOrClass}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Strategy Goal & Run Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 bg-background/40 rounded-lg border border-border/50">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Investment Strategy Focus:
              </span>
              <Select
                value={investmentGoal}
                onValueChange={(val) => {
                  setInvestmentGoal(val as InvestmentGoal);
                  setDuelResult(null);
                }}
              >
                <SelectTrigger className="h-8 w-64 bg-background/60 border-border/60 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Long-Term Compounding">📈 Long-Term Compounding (Quality & FCF)</SelectItem>
                  <SelectItem value="High Dividend Income">💰 High Dividend Income (Yield & Safety)</SelectItem>
                  <SelectItem value="Defensive & Capital Preservation">🛡️ Capital Preservation (Low Beta & Moat)</SelectItem>
                  <SelectItem value="Aggressive Growth">🚀 Aggressive Growth (Momentum & Upside)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleRunDuel}
            disabled={!dataA || !dataB || analyzing}
            className="h-10 px-6 font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center gap-2 shrink-0"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Arbitrating Duel...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run AI Arbitrator Ruling</span>
              </>
            )}
          </Button>
        </div>

        {/* AI Arbitrator Ruling Card (if available) */}
        {duelResult && (
          <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-primary/10 via-background/40 to-primary/5 border border-primary/30 shadow-xl animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                    Arbitrator Declared Winner
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-foreground tracking-tight">
                      {duelResult.winner}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background/60">
                      Confidence: {duelResult.confidenceLevel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Decisive Metric Highlights */}
              <div className="flex flex-wrap gap-1.5">
                {duelResult.winnerMetricsHighlight?.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-mono px-2 py-0.5 border border-border/50">
                    <Zap className="w-3 h-3 text-amber-500 mr-1" />
                    {h}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1">
              <strong className="text-[11px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Executive Synthesis ({investmentGoal})
              </strong>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {duelResult.executiveSummary}
              </p>
            </div>

            {/* 2-Column Strengths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-[11px] uppercase font-black tracking-wider text-emerald-500 block">
                  Why {dataA?.symbol} Wins
                </span>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 marker:text-emerald-500/70">
                  {duelResult.advantagesA?.map((adv, i) => (
                    <li key={i} className="leading-relaxed">{adv}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                <span className="text-[11px] uppercase font-black tracking-wider text-indigo-400 block">
                  Why {dataB?.symbol} Wins
                </span>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 marker:text-indigo-400/70">
                  {duelResult.advantagesB?.map((adv, i) => (
                    <li key={i} className="leading-relaxed">{adv}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategic Trade-off & Portfolio Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                <span className="font-bold text-rose-500 uppercase tracking-wider block mb-1">
                  Primary Trade-off
                </span>
                <p className="text-muted-foreground leading-relaxed">{duelResult.keyTradeoff}</p>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-bold text-primary uppercase tracking-wider block mb-1">
                  Portfolio Allocation Advice
                </span>
                <p className="text-muted-foreground leading-relaxed">{duelResult.portfolioRecommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Quantitative Matrix */}
        {dataA && dataB && (
          <div className="border border-border/50 rounded-xl overflow-hidden bg-background/30 mt-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-muted/40 py-2.5 px-3 border-b border-border/50 text-xs font-black uppercase tracking-wider">
              <div className="col-span-4 text-muted-foreground">Metric Breakdown</div>
              <div className="col-span-4 text-center text-primary flex items-center justify-center gap-2">
                <span>{dataA.symbol}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  onClick={() => handleAddWatchlist(dataA.symbol)}
                  title="Add to Watchlist"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="col-span-4 text-center text-primary flex items-center justify-center gap-2">
                <span>{dataB.symbol}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  onClick={() => handleAddWatchlist(dataB.symbol)}
                  title="Add to Watchlist"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Metric Rows */}
            <div className="divide-y divide-border/20">
              <div className="bg-muted/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Valuation & Pricing
              </div>
              {renderMetricRow("Current Price", dataA.price, dataB.price, (v) => `$${v.toFixed(2)}`, false)}
              {renderMetricRow("P/E Ratio", dataA.peRatio, dataB.peRatio, (v) => `${v.toFixed(1)}x`, false)}
              {renderMetricRow("FCF Yield", dataA.fcfYield, dataB.fcfYield, (v) => `${(v * 100).toFixed(1)}%`, true)}
              {renderMetricRow(
                "Market Cap / AUM",
                dataA.marketCapOrAssets,
                dataB.marketCapOrAssets,
                (v) => (v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(0)}M`),
                true
              )}

              <div className="bg-muted/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Dividends & Cash Return
              </div>
              {renderMetricRow("Dividend Yield", dataA.divYield, dataB.divYield, (v) => `${(v * 100).toFixed(2)}%`, true)}
              {renderMetricRow("5-Year Dividend CAGR", dataA.divCagr5y, dataB.divCagr5y, (v) => `${v.toFixed(1)}%`, true)}
              {renderMetricRow("Payout Ratio", dataA.payoutRatio, dataB.payoutRatio, (v) => `${v.toFixed(1)}%`, false)}

              <div className="bg-muted/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Quality, Efficiency & Risk
              </div>
              {renderMetricRow("Operating Margin", dataA.operatingMargins, dataB.operatingMargins, (v) => `${v.toFixed(1)}%`, true)}
              {renderMetricRow("Return on Equity (ROE)", dataA.roe, dataB.roe, (v) => `${v.toFixed(1)}%`, true)}
              {renderMetricRow("Expense Ratio (Fees)", dataA.expenseRatio, dataB.expenseRatio, (v) => `${(v * 100).toFixed(2)}%`, false)}
              {renderMetricRow("Debt-to-Equity (D/E)", dataA.deRatio, dataB.deRatio, (v) => `${v.toFixed(2)}x`, false)}
              {renderMetricRow("Current Ratio", dataA.currentRatio, dataB.currentRatio, (v) => `${v.toFixed(2)}x`, true)}
              {renderMetricRow("Beta (Volatility)", dataA.beta, dataB.beta, (v) => v.toFixed(2), false)}
              {renderMetricRow("RSI Momentum (14D)", dataA.rsi, dataB.rsi, (v) => v.toFixed(0), false)}
              {renderMetricRow("1-Year Performance", dataA.oneYearPerf, dataB.oneYearPerf, (v) => `${(v * 100).toFixed(1)}%`, true)}
              {renderMetricRow("Quality Score (0-100)", dataA.qualityScore, dataB.qualityScore, (v) => v.toFixed(0), true)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
