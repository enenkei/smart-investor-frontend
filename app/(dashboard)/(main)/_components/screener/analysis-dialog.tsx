"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalysisResult {
  symbol?: string;
  overview?: string;
  pros?: string[];
  cons?: string[];
  suitability?: string;
  verdict?: string;
  confidenceLevel?: string;
  confidence?: string;
  timeHorizon?: string;
  factorGrades?: Record<string, string>;
  [key: string]: any;
}

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: AnalysisResult | null;
  analyzingSymbol: string | null;
}

export function AnalysisDialog({
  open,
  onOpenChange,
  analysisResult,
  analyzingSymbol,
}: AnalysisDialogProps) {
  const symbol = analysisResult?.symbol || analyzingSymbol || "";

  const getVerdictVariant = (verdict?: string) => {
    if (!verdict) return "secondary";
    const v = verdict.toLowerCase();
    if (v.includes("buy") || v.includes("accumulate")) return "default";
    if (v.includes("sell") || v.includes("avoid")) return "destructive";
    return "secondary";
  };

  const formatFactorLabel = (key: string) => {
    if (key === "financialHealth") return "Financial Health";
    if (key === "feeEfficiency") return "Fee Efficiency";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const getFactorColor = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes("attractive") || v.includes("robust") || v.includes("ultra-low") || v.includes("broad")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (v.includes("fair") || v.includes("adequate") || v.includes("moderate") || v.includes("neutral")) {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    return "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[100vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl p-6 sm:p-8 custom-scrollbar">
        <DialogHeader className="border-b border-border/50 pb-4">
          <DialogTitle className="flex items-center justify-between text-xl font-black uppercase tracking-tight text-primary">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <span>AI Quantitative Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              {analysisResult?.timeHorizon && (
                <Badge variant="outline" className="text-[11px] font-medium tracking-normal px-2.5 py-0.5 bg-muted/30 text-muted-foreground border-border/60 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>{analysisResult.timeHorizon}</span>
                </Badge>
              )}
              {symbol && (
                <Badge variant="outline" className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-primary/10 text-primary border-primary/20">
                  {symbol}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {analyzingSymbol && !analysisResult && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 border-4 border-primary/20 rounded-full animate-ping" />
              <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-base font-mono font-bold text-foreground">
                Analyzing {analyzingSymbol}...
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Running quantitative evaluation across valuation multiples, growth, technical momentum, and risk factors.
              </p>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Overview Section */}
            <div className="bg-background/40 p-4 rounded-lg border border-border/40 space-y-1.5">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <strong className="uppercase text-[11px] font-black tracking-[0.15em]">Executive Summary</strong>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {analysisResult.overview}
              </p>
            </div>

            {/* Factor Scorecard Grid (if present) */}
            {analysisResult.factorGrades && Object.keys(analysisResult.factorGrades).length > 0 && (
              <div className="bg-background/30 p-4 rounded-lg border border-border/40 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Quantitative Factor Scorecard</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {Object.entries(analysisResult.factorGrades).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2.5 rounded-md bg-muted/20 border border-border/40">
                      <span className="text-xs font-medium text-muted-foreground">{formatFactorLabel(key)}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border", getFactorColor(String(val)))}>
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pros */}
              <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <strong className="uppercase text-[11px] font-black tracking-[0.15em]">Key Strengths & Pros</strong>
                </div>
                <ul className="list-disc pl-4 text-muted-foreground text-xs space-y-2 marker:text-emerald-500/70">
                  {analysisResult.pros?.map((p: string, i: number) => (
                    <li key={i} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>

              {/* Cons & Risks */}
              <div className="bg-rose-500/5 p-4 rounded-lg border border-rose-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                  <strong className="uppercase text-[11px] font-black tracking-[0.15em]">Risks & Headwinds</strong>
                </div>
                <ul className="list-disc pl-4 text-muted-foreground text-xs space-y-2 marker:text-rose-500/70">
                  {analysisResult.cons?.map((c: string, i: number) => (
                    <li key={i} className="leading-relaxed">{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suitability */}
            {analysisResult.suitability && (
              <div className="bg-background/40 p-4 rounded-lg border border-border/40 space-y-1.5">
                <strong className="text-indigo-400 uppercase text-[11px] font-black tracking-[0.15em] block">
                  Investor Suitability
                </strong>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {analysisResult.suitability}
                </p>
              </div>
            )}

            {/* Verdict & Confidence Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50 bg-muted/10 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase font-black tracking-[0.15em] text-muted-foreground">
                  Final Verdict:
                </span>
                <Badge
                  variant={getVerdictVariant(analysisResult.verdict)}
                  className="uppercase font-black text-xs px-3.5 py-1 shadow-sm tracking-wide"
                >
                  {analysisResult.verdict}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase font-black tracking-[0.15em] text-muted-foreground">
                  Confidence:
                </span>
                <span className="text-xs font-mono font-bold text-foreground bg-background/60 px-3 py-1 rounded border border-border/50">
                  {analysisResult.confidenceLevel || analysisResult.confidence || "High"}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
