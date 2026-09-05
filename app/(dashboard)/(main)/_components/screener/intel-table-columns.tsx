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
  Scale,
  Layers,
  Coins,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    "A": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "B": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "C": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "D": "bg-rose-500/10 text-rose-500 border-rose-500/20",
    "F": "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const letter = rating.charAt(0).toUpperCase();
  const colorClass = colors[letter] || "bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-wider px-1.5 py-0 rounded-none border", colorClass)}>
      {letter}
    </Badge>
  );
}

export function PercentCell({ value }: { value: number | null }) {
  if (value == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
  const isPos = value > 0;
  return (
    <span className={cn(
      "font-mono text-xs font-bold",
      isPos ? "text-emerald-500" : "text-rose-500"
    )}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

export interface GetIntelTableColumnsParams {
  onAddToWatchlist: (e: React.MouseEvent, symbol: string) => void;
  onAnalyze: (e: React.MouseEvent, row: any) => void;
  onCompare?: (symbol: string) => void;
  onAuditOverlap?: (symbol: string) => void;
  onSimulateSnowball?: (symbol: string, divYield?: number, divCagr?: number) => void;
  analyzingSymbol: string | null;
}

export function getIntelTableColumns({
  onAddToWatchlist,
  onAnalyze,
  onCompare,
  onAuditOverlap,
  onSimulateSnowball,
  analyzingSymbol,
}: GetIntelTableColumnsParams): ColumnDef<any>[] {
  return [
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const symbol = row.original.symbol;
        const isAnalyzing = analyzingSymbol === symbol;
        const divYield = row.original.annual_dividend_yield_pct ? Number(row.original.annual_dividend_yield_pct) : undefined;

        return (
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-none transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="Actions"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
                  )}
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToWatchlist(e, symbol);
                  }}
                >
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Add to Watchlist</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={isAnalyzing}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnalyze(e, row.original);
                  }}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  )}
                  <span>{isAnalyzing ? "Analyzing..." : "AI Analysis"}</span>
                </DropdownMenuItem>

                {(onCompare || onAuditOverlap || onSimulateSnowball) && <DropdownMenuSeparator />}

                {onCompare && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompare(symbol);
                    }}
                  >
                    <Scale className="w-4 h-4 text-sky-500" />
                    <span>Compare Head-to-Head</span>
                  </DropdownMenuItem>
                )}

                {onAuditOverlap && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuditOverlap(symbol);
                    }}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Audit ETF Overlap</span>
                  </DropdownMenuItem>
                )}

                {onSimulateSnowball && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulateSnowball(symbol, divYield, undefined);
                    }}
                  >
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>Dividend Simulator</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      id: "core_identity",
      header: () => <span className="text-primary font-black">Core Identity</span>,
      columns: [
        {
          accessorKey: "symbol",
          header: "Symbol",
          cell: ({ row }) => (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary border border-primary/20 shrink-0">
                    {row.original.symbol}
                  </div>
                  {row.original.previous_closing_price != null && (
                    <span className="text-xs font-normal text-gray-500">
                      (${Number(row.original.previous_closing_price).toFixed(2)})
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground truncate" title={row.original.etf_name}>
                  {row.original.etf_name}
                </span>
              </div>
            </div>
          ),
        },
        // {
        //   accessorKey: "asset_class",
        //   header: "Asset Class",
        //   cell: ({ row }) => (
        //     <Badge variant="secondary" className="text-[9px] uppercase font-bold whitespace-nowrap">
        //       {row.original.asset_class || "N/A"}
        //     </Badge>
        //   ),
        // },
        {
          accessorKey: "sector",
          header: "Sector / Category",
          cell: ({ row }) => (
            <Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted/30 whitespace-nowrap">
              {row.original.sector || row.original.etf_database_category || row.original.asset_class || "N/A"}
            </Badge>
          ),
        },
      ],
    },
    {
      id: "efficiency_cost",
      header: () => <span className="text-emerald-500 font-black">Efficiency & Cost</span>,
      columns: [
        {
          accessorKey: "expense_ratio",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Expense %
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.expense_ratio;
            if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
            return (
              <span className="font-mono text-xs text-foreground font-medium">
                {(Number(val) * 100).toFixed(2)}%
              </span>
            );
          },
        },
        // {
        //   accessorKey: "expenses_rating",
        //   header: "Rating",
        //   cell: ({ row }) => (
        //     <RatingBadge rating={row.original.expenses_rating} />
        //   ),
        // },
        {
          accessorKey: "tax_form",
          header: "Tax Form",
          cell: ({ row }) => (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded border",
              row.original.tax_form === "K-1"
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}>
              {row.original.tax_form || "1099"}
            </span>
          ),
        },
      ],
    },
    {
      id: "income_engine",
      header: () => <span className="text-blue-500 font-black">Income Engine</span>,
      columns: [
        {
          accessorKey: "annual_dividend_yield_pct",
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
            const val = row.original.annual_dividend_yield_pct;
            if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
            return (
              <span className="font-mono text-xs text-emerald-500 font-bold">
                {(Number(val)).toFixed(2)}%
              </span>
            );
          },
        },
        {
          accessorKey: "dividend_rating",
          header: "Rating",
          cell: ({ row }) => (
            <RatingBadge rating={row.original.dividend_rating} />
          ),
        },
        {
          accessorKey: "last_dividend_amount",
          header: "Last Payout",
          cell: ({ row }) => {
            const val = row.original.last_dividend_amount;
            if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
            return <span className="font-mono text-xs font-medium">${Number(val).toFixed(4)}</span>;
          },
        },
      ],
    },
    {
      id: "market_health",
      header: () => <span className="text-amber-500 font-black">Market Health</span>,
      columns: [
        {
          accessorKey: "total_assets",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                Assets
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => {
            const val = row.original.total_assets;
            if (val == null) return <span className="text-muted-foreground">-</span>;
            const assets = Number(val);
            const formatted = assets >= 1e9
              ? `$${(assets / 1e9).toFixed(1)}B`
              : `$${(assets / 1e6).toFixed(1)}M`;
            return <span className="font-mono text-xs font-medium">{formatted}</span>;
          },
        },
        {
          accessorKey: "avg_daily_volume",
          header: "Avg Volume",
          cell: ({ row }) => {
            const val = row.original.avg_daily_volume;
            if (val == null) return <span className="text-muted-foreground">-</span>;
            const vol = Number(val);
            const formatted = vol >= 1e6
              ? `${(vol / 1e6).toFixed(1)}M`
              : `${(vol / 1e3).toFixed(1)}K`;
            return <span className="font-mono text-xs font-medium">{formatted}</span>;
          },
        },
        {
          accessorKey: "liquidity_rating",
          header: "Liquidity",
          cell: ({ row }) => (
            <RatingBadge rating={row.original.liquidity_rating} />
          ),
        },
      ],
    },
    {
      id: "momentum",
      header: () => <span className="text-purple-500 font-black">Momentum</span>,
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
            const rsi = row.original.rsi;
            if (rsi == null) return <span className="text-muted-foreground">-</span>;
            const isLow = rsi < 35;
            const isHigh = rsi > 65;
            return (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-none font-mono text-[10px] px-2 py-0.5",
                  isLow && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
                  isHigh && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                  !isLow && !isHigh && "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                )}
              >
                {Number(rsi).toFixed(1)}
              </Badge>
            );
          },
        },
        {
          accessorKey: "ytd_price_change",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                YTD %
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => <PercentCell value={row.original.ytd_price_change} />,
        },
        {
          accessorKey: "one_month_perf",
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                1M %
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
          cell: ({ row }) => <PercentCell value={row.original.one_month_perf} />,
        },
      ],
    },
    {
      id: "risk_metrics",
      header: () => <span className="text-rose-500 font-black">Risk Metrics</span>,
      columns: [
        {
          accessorKey: "beta",
          header: "Beta",
          cell: ({ row }) => (
            <span className="font-mono text-xs">
              {row.original.beta != null ? Number(row.original.beta).toFixed(2) : "-"}
            </span>
          ),
        },
        {
          accessorKey: "volatility_rating",
          header: "Volatility",
          cell: ({ row }) => (
            <RatingBadge rating={row.original.volatility_rating} />
          ),
        },
        {
          accessorKey: "is_leveraged",
          header: "Lev",
          cell: ({ row }) => (
            row.original.is_leveraged ? (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">YES</Badge>
            ) : <span className="text-[10px] text-muted-foreground">No</span>
          ),
        },
        {
          accessorKey: "is_inverse",
          header: "Inv",
          cell: ({ row }) => (
            row.original.is_inverse ? (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">YES</Badge>
            ) : <span className="text-[10px] text-muted-foreground">No</span>
          ),
        },
      ],
    },
  ];
}
