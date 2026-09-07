"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrategyTheme } from "./types";
import { Info, CheckCircle2, Cpu, FileSpreadsheet } from "lucide-react";

interface StrategyMethodologyCardProps {
  theme: StrategyTheme;
}

export function StrategyMethodologyCard({ theme }: StrategyMethodologyCardProps) {
  return (
    <Card className="bg-card/20 backdrop-blur-xl border border-border/50 rounded-none overflow-hidden">
      <CardHeader className="bg-background/30 border-b border-border/40 px-5 py-3.5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Quantitative Methodology
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border/60">
          Factor Rules Engine
        </Badge>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-4">
        {/* Thesis */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
            Investment Thesis
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary pl-3">
            "{theme.why}"
          </p>
        </div>

        {/* Screening Criteria */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
            Screening & Eligibility Criteria
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {theme.criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-background/40 border border-border/40 px-3 py-1.5 rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-foreground">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithm Logic */}
        <div className="p-3 bg-background/50 border border-border/50 rounded-none flex items-start gap-2.5">
          <Cpu className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              Optimization Engine
            </span>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {theme.algorithmLogic}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
