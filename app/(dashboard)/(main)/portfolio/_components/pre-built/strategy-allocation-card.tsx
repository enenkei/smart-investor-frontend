"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyDonutChart } from "../strategy-donut-chart";
import { Copy, PieChart as PieIcon, Layers } from "lucide-react";
import { Strategy } from "./types";

interface StrategyAllocationCardProps {
  strategy: Strategy;
  onOpenCopyDialog: () => void;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
  "var(--chart-10)",
];

export function StrategyAllocationCard({
  strategy,
  onOpenCopyDialog,
}: StrategyAllocationCardProps) {
  const chartData = React.useMemo(() => {
    if (!strategy || !strategy.weights) return [];

    const weightsArray = Object.entries(strategy.weights as Record<string, number>).sort(
      ([, a], [, b]) => b - a
    );

    const topWeights = weightsArray.slice(0, 9);
    const others = weightsArray.slice(9).reduce((acc, [, val]) => acc + val, 0);

    const data = topWeights.map(([name, value], index) => ({
      name,
      value: Number((value * 100).toFixed(1)),
      color: COLORS[index % COLORS.length],
    }));

    if (others > 0) {
      data.push({
        name: "Others",
        value: Number((others * 100).toFixed(1)),
        color: COLORS[9],
      });
    }

    return data;
  }, [strategy]);

  return (
    <Card className="bg-card/20 backdrop-blur-xl border border-border/50 rounded-none overflow-hidden flex flex-col justify-between">
      <CardHeader className="bg-background/30 border-b border-border/40 px-5 py-3.5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Portfolio Allocation
          </CardTitle>
        </div>
        <Button
          size="sm"
          onClick={onOpenCopyDialog}
          className="h-7 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-[10px] uppercase tracking-widest gap-1.5 shadow-sm"
        >
          <Copy className="w-3 h-3" />
          Deploy to Portfolio
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px]">
        <StrategyDonutChart data={chartData} />
      </CardContent>
    </Card>
  );
}
