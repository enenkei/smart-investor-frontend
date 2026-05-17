"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrategyDonutChart } from "./strategy-donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { Info, TrendingUp, ShieldAlert, Zap, Layers, Copy, Star, ShieldCheck } from "lucide-react";
import StrategyCopyDialog from "./strategy-copy-dialog";

interface Strategy {
  slug: string;
  display_name: string;
  tickers: string[];
  weights: any;
  expected_return: number;
  expected_volatility: number;
  updated_at: string | Date;
  mode: string;
}

interface PreBuiltStrategiesProps {
  strategies: Strategy[];
}

const OBJECTIVES = [
  { id: "income-shield", name: "Income Shield", icon: ShieldAlert, why: "Prioritizing high-yield, low-volatility assets to preserve capital while generating steady cash flow." },
  { id: "income-shield-stocks", name: "Income Shield (Stocks)", icon: ShieldAlert, why: "High-yield, low-volatility common stocks for steady income." },
  { id: "income-shield-mix", name: "Income Shield (Mix)", icon: ShieldAlert, why: "Balanced hybrid approach to high-yield assets for capital preservation." },
  { id: "income-shield-etf", name: "Income Shield (Etf)", icon: ShieldAlert, why: "Diversified ETF basket focused on yield and low volatility." },
  { id: "blue-chip-growth-stocks", name: "Blue Chip Growth (Stocks)", icon: TrendingUp, why: "Established leaders with strong earnings momentum and consistent historical growth." },
  { id: "blue-chip-growth-mix", name: "Blue Chip Growth (Mix)", icon: TrendingUp, why: "Hybrid allocation of market leaders with strong growth potential." },
  { id: "deep-value-recovery-stocks", name: "Deep Value Recovery (Stocks)", icon: Zap, why: "Undervalued stocks with strong fundamentals poised for a breakout." },
  { id: "deep-value-recovery-mix", name: "Deep Value Recovery (Mix)", icon: Zap, why: "Hybrid approach to identifying undervalued assets poised for mean-reversion." },
  { id: "dividend-growth-stocks", name: "Dividend Aristocrats (Stocks)", icon: ShieldCheck, why: "Reliable income through stocks with 25+ years of consecutive dividend increases." },
  { id: "dividend-growth-etf", name: "Dividend Aristocrats (Etf)", icon: ShieldCheck, why: "Diversified ETF approach to Dividend Aristocrats for reliable income." },
  { id: "dividend-growth-mix", name: "Dividend Aristocrats (Mix)", icon: ShieldCheck, why: "A hybrid approach to reliable dividend growth assets." },
  { id: "high-quality-stocks", name: "Quality Kings (Stocks)", icon: Star, why: "Superior risk-adjusted returns by focusing on stocks with exceptional profitability." },
  { id: "high-quality-etf", name: "Quality Kings (Etf)", icon: Star, why: "Diversified ETF approach to high-quality companies with strong balance sheets." },
  { id: "high-quality-mix", name: "Quality Kings (Mix)", icon: Star, why: "A hybrid approach to superior risk-adjusted returns through quality assets." },
  { id: "total-return-titan-stocks", name: "Total Return Titan (Stocks)", icon: Layers, why: "Balanced stock approach seeking both capital appreciation and dividend income." },
  { id: "total-return-titan-etf", name: "Total Return Titan (Etf)", icon: Layers, why: "Diversified ETF approach seeking total returns through optimized weighting." },
  { id: "total-return-titan-mix", name: "Total Return Titan (Mix)", icon: Layers, why: "A hybrid approach seeking both capital appreciation and dividend income." },
];

// const MODES = [
//   { id: "stocks", name: "Stocks Only" },
//   { id: "etf", name: "ETF Only" },
//   { id: "mix", name: "Hybrid (Mix)" },
// ];

const COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
  "var(--chart-7)", "var(--chart-8)", "var(--chart-9)",
  "var(--chart-10)",
];

export function PreBuiltStrategies({ strategies }: PreBuiltStrategiesProps) {
  const [objective, setObjective] = React.useState("total-return-titan");
  const [mode, setMode] = React.useState("mix");
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false);

  const filteredStrategy = React.useMemo(() => {
    // 1. Try exact match first
    let match = strategies.find((s) => s.slug === objective);

    // 2. If no exact match (user might have selected a base), or if user interacted with mode selector
    // we re-calculate based on objective-mode pattern
    if (!match || (mode !== 'mix' && !objective.endsWith(mode))) {
      const base = objective.split('-').slice(0, -1).join('-') || objective;
      const slug = `${base}-${mode}`;
      const modeMatch = strategies.find((s) => s.slug === slug);
      if (modeMatch) match = modeMatch;
    }

    // 3. Last fallback
    if (!match) {
      match = strategies.find((s) => s.slug.startsWith(objective));
    }

    return match;
  }, [strategies, objective, mode]);

  const currentObjective = OBJECTIVES.find(o => o.id === objective) || OBJECTIVES[0];

  const chartData = React.useMemo(() => {
    if (!filteredStrategy || !filteredStrategy.weights) return [];

    // Sort weights and take top 10, group others
    const weightsArray = Object.entries(filteredStrategy.weights as Record<string, number>)
      .sort(([, a], [, b]) => b - a);

    const topWeights = weightsArray.slice(0, 9);
    const others = weightsArray.slice(9).reduce((acc, [, val]) => acc + val, 0);

    const data = topWeights.map(([name, value], index) => ({
      name,
      value: value * 100,
      color: COLORS[index],
    }));

    if (others > 0) {
      data.push({
        name: "Others",
        value: others * 100,
        color: COLORS[9],
      });
    }

    return data;
  }, [filteredStrategy]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-card/10 backdrop-blur-md px-6 py-4 rounded-none">
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Strategy Objective</Label>
            <Select
              value={objective}
              onValueChange={(val) => {
                setObjective(val);
                if (val.endsWith("-stocks")) setMode("stocks");
                else if (val.endsWith("-etf")) setMode("etf");
                else if (val.endsWith("-mix")) setMode("mix");
              }}
            >
              <SelectTrigger className="w-[320px] bg-background/50 border-border/50 font-medium text-sm h-10 rounded-none">
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border/50">
                {OBJECTIVES.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="rounded-none">
                    <div className="flex items-center gap-2">
                      <o.icon className="w-4 h-4 text-primary" />
                      {o.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          onClick={() => {
            setObjective("total-return-titan");
            setMode("mix");
          }}
          className="h-10 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
        >
          <Zap className="w-3 h-3" />
          Reset Configuration
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1 shadow-lg">

        <AnimatePresence mode="wait">
          {filteredStrategy ? (
            <motion.div
              key={filteredStrategy.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6 h-full"
            >
              <div className="grid grid-cols-3 gap-6">
                {/* Visual Section */}
                <Card className="col-span-2 bg-card/20 backdrop-blur-xl rounded-none overflow-hidden">
                  <CardHeader className="bg-background/20 shadow px-6 py-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold tracking-tight">{filteredStrategy.display_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">AI-Optimized Weights (SciPy)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20">{mode.toUpperCase()}</Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">{filteredStrategy.slug}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                    <StrategyDonutChart data={chartData} />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-none border-primary/30 text-primary hover:bg-primary/10 font-bold text-[10px] uppercase tracking-widest gap-2"
                      onClick={() => setCopyDialogOpen(true)}
                    >
                      <Copy className="w-3 h-3" />
                      Copy to Portfolio
                    </Button>
                  </CardContent>
                </Card>

                {/* Stats Section */}
                <div className="flex flex-col gap-6">
                  <Card className="bg-primary/5 border-primary/20 rounded-none">
                    <CardHeader className="p-6 pb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Expected Annual Return</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="text-4xl font-black tracking-tighter text-primary">
                        {(filteredStrategy.expected_return * 100).toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Targeted for {objective.replace(/-/g, ' ')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none">
                    <CardHeader className="p-6 pb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Volatility</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="text-4xl font-black tracking-tighter text-foreground">
                        {(filteredStrategy.expected_volatility * 100).toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Risk level: {filteredStrategy.expected_volatility < 0.05 ? "Low" : filteredStrategy.expected_volatility < 0.1 ? "Medium" : "High"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="flex-1 bg-card/20 backdrop-blur-xl border-border/50 rounded-none border-l-4 border-l-primary">
                    <CardHeader className="p-6 pb-2 flex flex-row items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">The "Why"</p>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <p className="text-sm leading-relaxed text-muted-foreground italic">
                        "{currentObjective.why}"
                      </p>
                      <div className="mt-4 p-3 bg-background/50 rounded-none border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mb-1">Algorithm Logic</p>
                        <p className="text-[11px] leading-snug">
                          {objective === 'income-shield'
                            ? "Prioritizing low-correlation assets to minimize drawdown while maintaining yield spreads."
                            : "Dynamic rebalancing based on mean-variance optimization with momentum constraints."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-none bg-muted/20 flex items-center justify-center animate-pulse">
                <Info className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium">No strategy found for this combination.</p>
              <button
                onClick={() => setMode("stocks")}
                className="text-sm text-primary hover:underline"
              >
                Try "Stocks Only" instead
              </button>
            </div>
          )}
        </AnimatePresence>
      </main>

      {filteredStrategy && (
        <StrategyCopyDialog
          isOpen={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          strategyName={filteredStrategy.display_name}
          tickers={filteredStrategy.tickers}
        />
      )}
    </div>
  );
}
