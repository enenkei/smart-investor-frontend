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
import {
  Layers,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  Plus,
  Equal,
  ShieldCheck,
  Zap,
  DollarSign,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EtfAuditItem,
  getMultipleEtfsForAudit,
  searchTickersForComparison,
} from "@/controllers/stock-data-controller";
import {
  auditEtfOverlapAndConcentration,
} from "@/controllers/ai-controller";
import { toast } from "sonner";

interface EtfOverlapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbol?: string;
}

interface OverlapAuditResult {
  overlapScore: string;
  estimatedOverlapPct: number;
  diversificationGrade: string;
  top10AggregateConcentrationPct: number;
  topConsolidatedHoldings: {
    ticker: string;
    companyName: string;
    estimatedWeightPct: number;
    contributingEtfs: string[];
  }[];
  executiveAuditSummary: string;
  redundancyWarnings: string[];
  consolidationRecommendations: string[];
}

export function EtfOverlapDialog({
  open,
  onOpenChange,
  initialSymbol,
}: EtfOverlapDialogProps) {
  const [basket, setBasket] = React.useState<EtfAuditItem[]>([]);
  const [loadingBasket, setLoadingBasket] = React.useState(false);

  // Search input for adding more ETFs
  const [searchQuery, setSearchQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Audit state
  const [auditing, setAuditing] = React.useState(false);
  const [auditResult, setAuditResult] = React.useState<OverlapAuditResult | null>(null);

  // Load initial ETFs
  React.useEffect(() => {
    if (open) {
      const symbolsToLoad = initialSymbol
        ? [initialSymbol.toUpperCase(), initialSymbol.toUpperCase() === "VOO" ? "QQQ" : "VOO"]
        : ["VOO", "QQQ", "SCHD"];

      loadEtfs(symbolsToLoad);
    }
  }, [open, initialSymbol]);

  const loadEtfs = async (symbols: string[]) => {
    setLoadingBasket(true);
    setAuditResult(null);
    const items = await getMultipleEtfsForAudit(symbols);
    // Equalize weights
    if (items.length > 0) {
      const equalWeight = Number((100 / items.length).toFixed(1));
      setBasket(items.map(it => ({ ...it, weight: equalWeight })));
    } else {
      setBasket([]);
    }
    setLoadingBasket(false);
  };

  // Autocomplete search
  React.useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchTickersForComparison(searchQuery);
      // Prioritize ETFs
      setSuggestions(results.filter(r => r.type === "ETF"));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddEtf = async (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase();
    if (basket.some(e => e.symbol === cleanSym)) {
      toast.info(`${cleanSym} is already in your basket`);
      return;
    }
    if (basket.length >= 5) {
      toast.warning("Maximum 5 ETFs allowed for audit");
      return;
    }

    const newItems = await getMultipleEtfsForAudit([cleanSym]);
    if (newItems.length === 0) {
      toast.error(`Could not find ETF data for ${cleanSym}`);
      return;
    }

    const updated = [...basket, newItems[0]];
    const equalWeight = Number((100 / updated.length).toFixed(1));
    setBasket(updated.map(e => ({ ...e, weight: equalWeight })));
    setSearchQuery("");
    setShowSuggestions(false);
    setAuditResult(null);
  };

  const handleRemoveEtf = (symbol: string) => {
    if (basket.length <= 2) {
      toast.error("At least 2 ETFs are required for an overlap audit");
      return;
    }
    const updated = basket.filter(e => e.symbol !== symbol);
    const equalWeight = Number((100 / updated.length).toFixed(1));
    setBasket(updated.map(e => ({ ...e, weight: equalWeight })));
    setAuditResult(null);
  };

  const handleWeightChange = (symbol: string, newWeight: number) => {
    setBasket(prev =>
      prev.map(e => (e.symbol === symbol ? { ...e, weight: newWeight } : e))
    );
    setAuditResult(null);
  };

  const handleEqualize = () => {
    if (basket.length === 0) return;
    const equalWeight = Number((100 / basket.length).toFixed(1));
    setBasket(prev => prev.map(e => ({ ...e, weight: equalWeight })));
    setAuditResult(null);
  };

  // Summary calculations
  const totalWeight = basket.reduce((acc, e) => acc + (e.weight || 0), 0);
  const blendedExpense = totalWeight > 0
    ? basket.reduce((acc, e) => acc + ((e.expenseRatio || 0) * (e.weight / totalWeight)), 0)
    : 0;
  const blendedYield = totalWeight > 0
    ? basket.reduce((acc, e) => acc + ((e.annualDividendYield || 0) * (e.weight / totalWeight)), 0)
    : 0;
  const annualCostPer100k = blendedExpense * 100000;

  const handleRunAudit = async () => {
    if (basket.length < 2) {
      toast.error("At least 2 ETFs are required for an overlap audit");
      return;
    }

    setAuditing(true);
    const res = await auditEtfOverlapAndConcentration(basket);
    setAuditing(false);

    if (res.ok && res.data) {
      setAuditResult(res.data as OverlapAuditResult);
    } else {
      toast.error(res.error || "Overlap audit failed");
    }
  };

  const getGradeBadge = (grade: string) => {
    const g = grade.charAt(0).toUpperCase();
    if (g === "A") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    if (g === "B") return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    if (g === "C") return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    return "bg-rose-500/10 text-rose-500 border-rose-500/30";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border/60 rounded-xl shadow-2xl p-6 sm:p-8 custom-scrollbar">
        <DialogHeader className="border-b border-border/50 pb-4">
          <DialogTitle className="flex items-center justify-between text-xl font-black uppercase tracking-tight text-primary">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                <Layers className="w-5 h-5 text-sky-400" />
              </div>
              <span>ETF Overlap & Concentration Auditor</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 bg-sky-500/5 text-sky-400 border-sky-500/20">
              Institutional Portfolio Risk Engine
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Top Basket Overview & Controls */}
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-background/40 p-3.5 rounded-lg border border-border/50">
            {/* Search/Add ETF */}
            <div className="relative flex-1 max-w-md">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value.toUpperCase());
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Add ETF to Basket (e.g. VOO, QQQ, VTI, SCHD)..."
                  className="font-mono uppercase font-bold text-xs bg-background/60 border-border/60 uppercase h-9"
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchQuery) {
                      handleAddEtf(searchQuery);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="font-bold text-xs h-9 shrink-0"
                  onClick={() => searchQuery && handleAddEtf(searchQuery)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border/60 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                  {suggestions.map(item => (
                    <div
                      key={item.symbol}
                      className="px-3 py-2 hover:bg-accent/40 cursor-pointer flex items-center justify-between text-xs"
                      onClick={() => handleAddEtf(item.symbol)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-primary">{item.symbol}</span>
                        <span className="text-muted-foreground truncate max-w-[180px]">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {item.sector || "ETF"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equalize & Action */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEqualize}
                className="text-xs font-semibold h-9 border-border/60"
                title="Reset to Equal Weightings"
              >
                <Equal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                Equalize
              </Button>

              <Button
                onClick={handleRunAudit}
                disabled={basket.length < 2 || auditing}
                className="h-9 px-5 font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md flex items-center gap-2 shrink-0"
              >
                {auditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Basket...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Run Overlap Audit</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Active Basket Chips & Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {basket.map(etf => (
              <div
                key={etf.symbol}
                className="p-3 bg-background/50 rounded-lg border border-border/50 space-y-2.5 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-foreground">{etf.symbol}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                        {etf.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                      {etf.name}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-muted-foreground hover:text-destructive opacity-80 group-hover:opacity-100"
                    onClick={() => handleRemoveEtf(etf.symbol)}
                    title="Remove from Basket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Metrics Pill */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-muted-foreground border-t border-border/30">
                  <div>
                    <span className="block font-medium">Exp:</span>
                    <span className="font-mono font-bold text-foreground">
                      {etf.expenseRatio != null ? `${(etf.expenseRatio * 100).toFixed(2)}%` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-medium">Yield:</span>
                    <span className="font-mono font-bold text-emerald-500">
                      {etf.annualDividendYield != null ? `${(etf.annualDividendYield * 100).toFixed(2)}%` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-medium">Top 10:</span>
                    <span className="font-mono font-bold text-foreground">
                      {etf.pctInTop10 != null ? `${etf.pctInTop10.toFixed(0)}%` : "-"}
                    </span>
                  </div>
                </div>

                {/* Weight Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground font-medium">Allocation Weight:</span>
                    <span className="font-mono font-black text-primary">{etf.weight}%</span>
                  </div>
                  <Slider
                    value={[etf.weight]}
                    min={5}
                    max={95}
                    step={5}
                    onValueChange={([val]) => handleWeightChange(etf.symbol, val)}
                    className="py-1"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate Basket Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg border border-border/40 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Basket Weight Sum</span>
              <span className={cn("font-mono font-bold text-sm", totalWeight === 100 ? "text-emerald-500" : "text-amber-500")}>
                {totalWeight.toFixed(0)}% {totalWeight !== 100 && "(Normalized)"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Blended Expense Ratio</span>
              <span className="font-mono font-bold text-sm text-foreground">
                {(blendedExpense * 100).toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Est. Cost / $100k / Yr</span>
              <span className="font-mono font-bold text-sm text-muted-foreground">
                ${annualCostPer100k.toFixed(0)}/yr
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Blended Div Yield</span>
              <span className="font-mono font-bold text-sm text-emerald-500">
                {(blendedYield * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Audit Report Card */}
        {auditResult && (
          <div className="space-y-5 p-6 rounded-xl bg-gradient-to-br from-sky-500/10 via-background/40 to-background border border-sky-500/30 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 mt-2">
            {/* Top Scorecard Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
                  <PieChart className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                    Portfolio Diversification Grade
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-base font-black px-3 py-0.5", getGradeBadge(auditResult.diversificationGrade))}>
                      {auditResult.diversificationGrade}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {auditResult.overlapScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overlap & Concentration Metrics */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Weighted Overlap</span>
                  <span className={cn("font-mono font-black text-xl", auditResult.estimatedOverlapPct > 50 ? "text-rose-500" : auditResult.estimatedOverlapPct > 25 ? "text-amber-500" : "text-emerald-500")}>
                    {auditResult.estimatedOverlapPct}%
                  </span>
                </div>
                <div className="text-right pl-4 border-l border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Top 10 Weight</span>
                  <span className="font-mono font-black text-xl text-foreground">
                    {auditResult.top10AggregateConcentrationPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Executive Diagnosis */}
            <div className="space-y-1.5">
              <strong className="text-[11px] uppercase font-black tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Institutional Risk Diagnosis
              </strong>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {auditResult.executiveAuditSummary}
              </p>
            </div>

            {/* Consolidated Top Stock Holdings Breakdown */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black tracking-wider text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Consolidated Top Underlying Stock Exposures
                </span>
                <span className="text-[10px] text-muted-foreground">True weight across all selected funds</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {auditResult.topConsolidatedHoldings?.map((h) => (
                  <div
                    key={h.ticker}
                    className="p-3 bg-background/60 rounded-lg border border-border/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-black text-xs text-foreground">{h.ticker}</span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{h.companyName}</span>
                      </div>
                      <span className="font-mono font-black text-xs text-primary">
                        {h.estimatedWeightPct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{ width: `${Math.min(h.estimatedWeightPct * 5, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-[9px] text-muted-foreground">Held in:</span>
                      {h.contributingEtfs?.map((fund) => (
                        <Badge key={fund} variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono">
                          {fund}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redundancy Warnings & Consolidation Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Warnings */}
              <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                  <strong className="uppercase text-[11px] font-black tracking-wider">Redundancy & Fee Warnings</strong>
                </div>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 marker:text-rose-500/70">
                  {auditResult.redundancyWarnings?.map((warn, i) => (
                    <li key={i} className="leading-relaxed">{warn}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <strong className="uppercase text-[11px] font-black tracking-wider">Portfolio Consolidation Roadmap</strong>
                </div>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 marker:text-emerald-500/70">
                  {auditResult.consolidationRecommendations?.map((rec, i) => (
                    <li key={i} className="leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
