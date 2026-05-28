"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Shield,
  TrendingUp,
  Wallet,
  Target,
  Lock,
  ArrowUpRight,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Sparkles,
  Loader2
} from "lucide-react";
import IntelPopup from "./intel-popup";
import StrategyPopup from "./strategy-popup";
import { addToWatchlist } from "@/controllers/stock-data-controller";
import { analyzeSelectedStock, StockDetail } from "@/controllers/ai-controller";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Sp500IntelTableProps {
  data: any[];
  loading?: boolean;
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sector: string;
  onSectorChange: (value: string) => void;
  sectors: string[];
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const Sparkline = ({ data }: { data: any }) => {
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
    <svg width={width} height={height} className="overflow-visible inline-block">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export function Sp500IntelTable({
  data,
  loading,
  selectedSymbol,
  onSelectSymbol,
  search,
  onSearchChange,
  sector,
  onSectorChange,
  sectors,
  page,
  totalPages,
  onPageChange
}: Sp500IntelTableProps) {
  const [flyingItems, setFlyingItems] = React.useState<{ id: number; x: number; y: number; symbol: string }[]>([]);
  const [analyzingSymbol, setAnalyzingSymbol] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);

  const handleAddToWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const newItem = {
      id: Date.now(),
      x: rect.left,
      y: rect.top,
      symbol
    };
    setFlyingItems(prev => [...prev, newItem]);

    const res = await addToWatchlist(symbol);
    if (res.success) {
      toast.success(`${symbol} added to watchlist`);
      window.dispatchEvent(new Event("watchlist-updated"));
    } else {
      toast.error(res.error || `Failed to add ${symbol}`);
    }

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
    }, 1000);
  };

  const handleAnalyze = async (e: React.MouseEvent, row: any) => {
    e.stopPropagation();
    setAnalyzingSymbol(row.ticker);

    const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
    const cacheKey = `ai-analysis-stock-${row.ticker}`;
    const cachedDataStr = localStorage.getItem(cacheKey);

    if (cachedDataStr) {
      try {
        const cachedData = JSON.parse(cachedDataStr);
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
          setAnalysisResult(cachedData.result);
          setAnalyzingSymbol(null);
          return;
        }
      } catch (err) {
        console.error("Failed to parse cached analysis", err);
      }
    }

    const stockData: StockDetail = {
      symbol: row.ticker,
      name: row.name || '',
      sector: row.sector || '',
      price: row.prev_close ? Number(row.prev_close) : null,
      adaptiveScore: row.adaptive_total_score ? Number(row.adaptive_total_score) : null,
      qualityScore: row.quality_score ? Number(row.quality_score) : null,
      divYield: row.dividend_yield ? Number(row.dividend_yield) : null,
      divCagr5y: row.dividend_cagr_5y ? Number(row.dividend_cagr_5y) : null,
      payoutRatio: row.payout_ratio ? Number(row.payout_ratio) : null,
      peRatio: row.pe_ratio ? Number(row.pe_ratio) : null,
      fcfYield: row.fcf_yield ? Number(row.fcf_yield) : null,
      deRatio: row.de_ratio ? Number(row.de_ratio) : null,
      rsi: row.rsi ? Number(row.rsi) : null,
      totalReturn: row.total_return ? Number(row.total_return) : null,
      epsGrowth5y: row.eps_growth_5y ? Number(row.eps_growth_5y) : null,
      beta: row.beta ? Number(row.beta) : null,
    };

    const res = await analyzeSelectedStock(stockData);
    setAnalyzingSymbol(null);
    if (res.ok) {
      setAnalysisResult(res.data);
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        result: res.data
      }));
    } else {
      toast.error(res.error || "Analysis failed");
    }
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-primary hover:bg-primary/10"
              onClick={(e) => handleAddToWatchlist(e, row.original.ticker)}
              title="Add to Watchlist"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-amber-500 hover:bg-amber-500/10"
              onClick={(e) => handleAnalyze(e, row.original)}
              title="AI Analysis"
              disabled={analyzingSymbol === row.original.ticker}
            >
              {analyzingSymbol === row.original.ticker ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
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
            cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary">
                  {row.original.ticker}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-row items-center justify-between"><span className="font-bold tracking-tight text-[11px] truncate">{row.original.ticker}</span><span className="text-[8px] text-muted-foreground uppercase font-semibold max-w-[80px] mx-auto">${row.original.prev_close.toFixed(2)}</span></div>
                  <span className="text-[8px] text-muted-foreground uppercase font-medium truncate max-w-[80px]">{row.original.name}</span>
                </div>
              </div>
            ),
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
            }
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
              )
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
              )
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.pe_ratio;
              return <span className="font-mono text-xs">{val != null ? Number(val).toFixed(1) : "-"}</span>;
            }
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.fcf_yield;
              return <span className="font-mono text-amber-500/80 text-[10px] font-bold">{val != null ? `${(Number(val) * 100).toFixed(1)}%` : "-"}</span>;
            }
          },
          {
            accessorKey: "de_ratio",
            header: "D/E",
            cell: ({ row }) => {
              const val = row.original.de_ratio;
              return <span className="font-mono text-muted-foreground text-[10px]">{val != null ? Number(val).toFixed(2) : "-"}</span>;
            }
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
              )
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.total_return;
              if (val == null) return <span className="text-muted-foreground">-</span>;
              const num = Number(val);
              return (
                <span className={cn(
                  "font-mono font-bold text-[10px]",
                  num > 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {num > 0 ? "+" : ""}{(num * 100).toFixed(1)}%
                </span>
              );
            }
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
            }
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
            }
          }
        ],
      },
    ],
    []
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/20 p-4 border border-border/50 rounded-lg backdrop-blur-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ticker or company..."
            className="pl-9 bg-background/50 border-none h-9 text-xs"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <Select value={sector} onValueChange={onSectorChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-background/50 border-none h-9 text-xs">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sectors</SelectItem>
              {sectors.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border/50 bg-card/5 backdrop-blur-sm overflow-hidden rounded-none shadow-xl">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50 border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "text-[9px] uppercase font-black tracking-widest h-8 py-0 border-r border-border/20 last:border-r-0 text-center bg-background/20",
                      header.depth === 0 ? "text-primary/70 bg-primary/5 h-6" : "text-muted-foreground"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-border/10 h-10">
                  <TableCell colSpan={table.getVisibleLeafColumns().length}>
                    <div className="h-3 bg-muted/20 w-full rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isHighQualityLowRsi = (Number(row.original.quality_score) || 0) > 80 && (Number(row.original.rsi) || 0) < 35;
                const isSelected = selectedSymbol === row.original.ticker;

                return (
                  <TableRow
                    key={row.id}
                    id={`stock-row-${row.original.ticker}`}
                    data-state={isSelected ? "selected" : ""}
                    className={cn(
                      "cursor-pointer transition-all border-border/20 h-14 group",
                      isSelected
                        ? "bg-primary/10"
                        : "hover:bg-muted/30",
                      isHighQualityLowRsi && "border-2 border-double border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10"
                    )}
                    onClick={() => onSelectSymbol(row.original.ticker)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-0 relative h-10 px-2 border-r border-border/5 last:border-r-0">
                        {isSelected && cell.column.id === "ticker" && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                        )}
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center text-muted-foreground font-medium italic">
                  No "Hunter" signals found with current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 border-none bg-card/20"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 border-none bg-card/20"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 border-none bg-card/20"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 border-none bg-card/20"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Flying Animation Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ x: item.x, y: item.y, opacity: 1, scale: 1 }}
              animate={{
                x: window.innerWidth - 100,
                y: 50,
                opacity: 0,
                scale: 0.5
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] font-black z-[101] shadow-lg"
            >
              {item.symbol}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog
        open={!!analysisResult || !!analyzingSymbol}
        onOpenChange={(open) => {
          if (!open) {
            setAnalysisResult(null);
            setAnalyzingSymbol(null);
          }
        }}
      >
        <DialogContent className="max-w-xl bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-primary">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Analysis: {analysisResult?.symbol || analyzingSymbol}
            </DialogTitle>
          </DialogHeader>

          {analyzingSymbol && !analysisResult && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-16 h-16 border-4 border-primary/20 rounded-full animate-ping" />
                <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-mono font-bold text-foreground">Running quantitative analysis...</p>
                <p className="text-xs text-muted-foreground">Evaluating valuation, momentum, and risk metrics</p>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <strong className="text-primary uppercase text-[10px] font-black tracking-[0.2em] opacity-70 block mb-2">Overview</strong>
                <p className="text-muted-foreground text-sm leading-relaxed">{analysisResult.overview}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-background/30 p-4 rounded-lg border border-border/50">
                <div>
                  <strong className="text-emerald-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">Pros</strong>
                  <ul className="list-disc pl-4 text-muted-foreground text-xs space-y-1.5 marker:text-emerald-500/50">
                    {analysisResult.pros?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <strong className="text-rose-500 uppercase text-[10px] font-black tracking-[0.2em] block mb-2">Risks & Cons</strong>
                  <ul className="list-disc pl-4 text-muted-foreground text-xs space-y-1.5 marker:text-rose-500/50">
                    {analysisResult.cons?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <strong className="text-blue-500 uppercase text-[10px] font-black tracking-[0.2em] opacity-70 block mb-2">Suitability</strong>
                <p className="text-muted-foreground text-sm leading-relaxed">{analysisResult.suitability}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50 bg-muted/10 p-4 rounded-lg mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Verdict</span>
                  <Badge variant={analysisResult.verdict?.includes('Buy') ? 'default' : analysisResult.verdict?.includes('Sell') ? 'destructive' : 'secondary'} className="uppercase font-black text-[10px] px-3 py-1 shadow-sm">
                    {analysisResult.verdict}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Confidence</span>
                  <span className="text-xs font-mono font-bold text-foreground bg-background/50 px-3 py-1 rounded border border-border/50">
                    {analysisResult.confidenceLevel || analysisResult.confidence}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
