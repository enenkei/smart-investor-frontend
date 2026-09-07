"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StrategyHoldingDetail } from "@/lib/actions/strategies";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ListOrdered, TrendingUp } from "lucide-react";
import { Strategy } from "./types";

interface StrategyHoldingsTableProps {
  strategy: Strategy;
  holdings: StrategyHoldingDetail[];
  isLoading: boolean;
}

export function StrategyHoldingsTable({
  strategy,
  holdings,
  isLoading,
}: StrategyHoldingsTableProps) {
  return (
    <Card className="bg-card/20 backdrop-blur-xl border border-border/50 rounded-none overflow-hidden">
      <CardHeader className="bg-background/30 border-b border-border/40 px-5 py-3.5 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Holdings Breakdown ({holdings.length} Assets)
          </CardTitle>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Rank-optimized weighting
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-24 rounded-none" />
                <Skeleton className="h-5 w-36 rounded-none" />
                <Skeleton className="h-5 w-16 rounded-none" />
                <Skeleton className="h-5 w-20 rounded-none" />
              </div>
            ))}
          </div>
        ) : holdings.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No holdings found for this strategy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground w-12">
                    #
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Asset
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Sector / Class
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground w-36">
                    Target Weight
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
                    Price
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
                    Yield
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
                    Beta
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">
                    Quant Score
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {holdings.map((h, idx) => {
                  const weightDecimal = strategy.weights?.[h.ticker] ?? 0;
                  const weightPct = (weightDecimal * 100).toFixed(1);

                  return (
                    <TableRow key={h.ticker} className="border-border/30 hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs tracking-tight text-foreground">
                            {h.ticker}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 border-border/60 text-muted-foreground font-mono"
                          >
                            {h.type}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-[280px]">
                          {h.name}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {h.sector}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Progress value={parseFloat(weightPct) * 4} className="h-1.5 flex-1 rounded-none bg-muted/40" />
                          <span className="font-mono font-bold text-xs w-10 text-right">
                            {weightPct}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs">
                        ${h.price > 0 ? h.price.toFixed(2) : "--"}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-amber-500 font-semibold">
                        {h.dividend_yield > 0 ? `${h.dividend_yield.toFixed(2)}%` : "--"}
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {h.beta > 0 ? h.beta.toFixed(2) : "1.00"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20"
                        >
                          {(h.score * 100).toFixed(0)} / 100
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
