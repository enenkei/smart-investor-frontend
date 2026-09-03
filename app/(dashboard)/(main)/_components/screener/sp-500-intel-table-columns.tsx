"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Plus,
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  Wallet,
  Target,
  Lock,
  ArrowUpRight,
  AlertTriangle,
  Scale,
} from "lucide-react";
import IntelPopup from "./intel-popup";
import StrategyPopup from "./strategy-popup";

export const Sparkline = ({ data }: { data: any }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-muted-foreground/30 text-xs font-mono font-medium">-</div>;
  }

  // Sort by date chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const prices = sortedData.map(d => Number(d.price)).filter(p => !isNaN(p));

  if (prices.length < 2) {
    return <div className="text-muted-foreground/30 text-xs font-mono font-medium">-</div>;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min === 0 ? 1 : max - min;

  const width = 70;
  const height = 18;
  const padding = 1;

  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((price - min) / range) * (height - 2 * padding) - padding;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const isPositive = prices[prices.length - 1] >= prices[0];
  const strokeColor = isPositive ? "#34d399" : "#f87171"; // Emerald-400 or Rose-400
  const fillId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export interface GetSp500IntelTableColumnsParams {
  onAddToWatchlist: (e: React.MouseEvent, symbol: string) => void;
  onAnalyze: (e: React.MouseEvent, row: any) => void;
  onCompare?: (symbol: string) => void;
  analyzingSymbol: string | null;
}

export function getSp500IntelTableColumns({
  onAddToWatchlist,
  onAnalyze,
  onCompare,
  analyzingSymbol,
}: GetSp500IntelTableColumnsParams): ColumnDef<any>[] {
  return [
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-primary hover:bg-primary/10"
            onClick={(e) => onAddToWatchlist(e, row.original.ticker)}
            title="Add to Watchlist"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-amber-500 hover:bg-amber-500/10"
            onClick={(e) => onAnalyze(e, row.original)}
            title="AI Analysis"
            disabled={analyzingSymbol === row.original.ticker}
          >
            {analyzingSymbol === row.original.ticker ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
          {onCompare && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-sky-500 hover:bg-sky-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onCompare(row.original.ticker);
              }}
              title="Compare Head-to-Head Duel"
            >
              <Scale className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
      id: "identity",
      header: "Identity",
      columns: [
        {
          accessorKey: "ticker",
          header: "Ticker",
          cell: ({ row }) => {
            const price = row.original.prev_close ?? row.original.current_price;
            return (
              <div className="flex items-center gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-row items-center gap-2">
                    <div className="w-6 h-6 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary">
                      {row.original.ticker}
                    </div>
                    {price != null && (
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold max-w-[80px]">
                        ${Number(price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium truncate max-w-[120px]">
                    {row.original.name}
                  </span>
                </div>
              </div>
            );
          },
        },
        {
          accessorKey: "price_history",
          header: "Trend (2Y)",
          cell: ({ row }) => {
            const history = row.original.price_history;
            return (
              <div className="flex items-center justify-center">
                <Sparkline data={history} />
              </div>
            );
          },
        },
        {
          accessorKey: "sector",
          header: "Sector",
          cell: ({ row }) => (
            <Badge variant={"secondary"}>{row.original.sector}</Badge>
          ),
        },
      ],
    },
    {
      accessorKey: "quality_score",
      header: "Quality",
      cell: ({ row }) => {
        const rawScore = Number(row.original.quality_score) || 0;
        const score = rawScore <= 1 ? rawScore * 100 : rawScore;
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-1 bg-muted rounded-none overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-rose-500"
                )}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <span className="font-mono font-bold text-[9px] text-muted-foreground">
              {score < 0.1 && score > 0 ? "<0.1" : score.toFixed(1)}
            </span>
          </div>
        );
      },
    },
    {
      id: "yield_growth",
      header: "Yield & Growth",
      columns: [
        {
          accessorKey: "dividend_yield",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Yield
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.dividend_yield;
            return (
              <span className="font-mono font-bold text-emerald-500 text-[11px]">
                {val != null ? `${Number(val).toFixed(2)}%` : "-"}
              </span>
            );
          },
        },
        {
          accessorKey: "dividend_cagr_5y",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                5Y CAGR
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.dividend_cagr_5y;
            return (
              <span className="font-mono text-emerald-400 text-[10px]">
                {val != null ? `${Number(val).toFixed(1)}%` : "-"}
              </span>
            );
          },
        },
        {
          accessorKey: "payout_ratio",
          header: "Payout",
          cell: ({ row }) => {
            const val = row.original.payout_ratio;
            return (
              <span className="font-mono text-muted-foreground text-[10px]">
                {val != null ? `${Number(val).toFixed(0)}%` : "-"}
              </span>
            );
          },
        },
      ],
    },
    {
      id: "value_health",
      header: "Value & Health",
      columns: [
        {
          accessorKey: "pe_ratio",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                P/E
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.pe_ratio;
            return <span className="font-mono text-xs">{val != null ? Number(val).toFixed(1) : "-"}</span>;
          },
        },
        {
          accessorKey: "fcf_yield",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                FCF %
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.fcf_yield;
            return (
              <span className="font-mono text-amber-500/80 text-[10px] font-bold">
                {val != null ? `${(Number(val) * 100).toFixed(1)}%` : "-"}
              </span>
            );
          },
        },
        {
          accessorKey: "de_ratio",
          header: "D/E",
          cell: ({ row }) => {
            const val = row.original.de_ratio;
            return <span className="font-mono text-muted-foreground text-[10px]">{val != null ? Number(val).toFixed(2) : "-"}</span>;
          },
        },
      ],
    },
    {
      id: "momentum",
      header: "Momentum",
      columns: [
        {
          accessorKey: "rsi",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                RSI
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const rsi = Number(row.original.rsi);
            if (isNaN(rsi)) return <span className="text-muted-foreground">-</span>;
            const isLow = rsi < 35;
            const isHigh = rsi > 65;
            return (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-none font-mono text-[9px] px-1.5 py-0",
                  isLow && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
                  isHigh && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                  !isLow && !isHigh && "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                )}
              >
                {rsi.toFixed(0)}
              </Badge>
            );
          },
        },
        {
          accessorKey: "total_return",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Return
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.total_return;
            if (val == null) return <span className="text-muted-foreground">-</span>;
            const num = Number(val);
            return (
              <span
                className={cn(
                  "font-mono font-bold text-[10px]",
                  num > 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {num > 0 ? "+" : ""}
                {(num * 100).toFixed(1)}%
              </span>
            );
          },
        },
      ],
    },
    {
      id: "intelligence",
      header: "Intelligence",
      columns: [
        {
          id: "strategy",
          header: () => (
            <div className="flex items-center justify-center gap-1.5">
              <span>Strategy</span>
              <StrategyPopup />
            </div>
          ),
          cell: ({ row }) => {
            const getScale = (v: any) => {
              const n = Number(v) || 0;
              return n <= 1 && n > 0 ? n * 100 : n;
            };

            const divYield = getScale(row.original.dividend_yield);
            const divCagr = getScale(row.original.dividend_cagr_5y);
            const payout = getScale(row.original.payout_ratio);
            const epsGrowth = getScale(row.original.eps_growth_5y);
            const quality = getScale(row.original.quality_score);
            const fcfYield = getScale(row.original.fcf_yield);
            const beta = Number(row.original.beta) || 0;

            let label = null;
            if (divYield >= 2 && divYield <= 4 && divCagr > 8 && payout < 50) {
              label = { text: "Balanced Compounder", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Shield };
            } else if (divYield < 1.5 && epsGrowth > 15 && quality > 80) {
              label = { text: "Aggressive Grower", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: TrendingUp };
            } else if (divYield > 5 && fcfYield > divYield && beta < 0.9) {
              label = { text: "Cash Cow", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Wallet };
            }

            if (!label) return <span className="text-[10px] text-muted-foreground/40">-</span>;

            return (
              <Badge variant="outline" className={cn("rounded-none text-[9px] px-1.5 py-0 gap-1 whitespace-nowrap", label.color)}>
                <label.icon size={10} />
                {label.text}
              </Badge>
            );
          },
        },
        {
          id: "intel",
          header: () => (
            <div className="flex items-center justify-center gap-1.5">
              <span>Intel</span>
              <IntelPopup />
            </div>
          ),
          cell: ({ row }) => {
            const getScale = (v: any) => {
              const n = Number(v) || 0;
              return n <= 1 && n > 0 ? n * 100 : n;
            };

            const adaptive = getScale(row.original.adaptive_total_score);
            const rsi = Number(row.original.rsi) || 0;
            const pe = Number(row.original.pe_ratio) || 0;
            const divYield = getScale(row.original.dividend_yield);
            const payout = getScale(row.original.payout_ratio);
            const fcfYield = getScale(row.original.fcf_yield);

            let label = null;
            if (adaptive > 85 && rsi < 35) {
              label = { text: "Opportunity Window", color: "bg-emerald-600 text-white border-transparent shadow-[0_0_10px_rgba(16,185,129,0.3)]", icon: Target };
            } else if (adaptive > 70 && rsi >= 45 && rsi <= 65) {
              label = { text: "Fair Value Holder", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Lock };
            } else if (rsi > 75 && pe > 25) {
              label = { text: "Profit Taker", color: "bg-amber-500 text-white border-transparent", icon: ArrowUpRight };
            } else if (divYield > 7 && payout > 90 && fcfYield < divYield) {
              label = { text: "Value Trap", color: "bg-rose-600 text-white border-transparent", icon: AlertTriangle };
            }

            if (!label) return <span className="text-[10px] text-muted-foreground/40">-</span>;

            return (
              <Badge variant="outline" className={cn("rounded-none text-[9px] px-1.5 py-0 gap-1 whitespace-nowrap font-black uppercase tracking-tighter", label.color)}>
                <label.icon size={10} strokeWidth={3} />
                {label.text}
              </Badge>
            );
          },
        },
      ],
    },
  ];
}
