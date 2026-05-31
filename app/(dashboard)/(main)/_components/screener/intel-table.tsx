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
  ArrowUpDown,
  Plus,
  Sparkles,
  Loader2
} from "lucide-react";
import { addToWatchlist } from "@/controllers/stock-data-controller";
import { analyzeSelectedEtf, EtfDetail } from "@/controllers/ai-controller";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface IntelTableProps {
  data: any[];
  loading?: boolean;
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sector: string;
  onSectorChange: (s: string) => void;
  sectors: string[];
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  dividendRating?: string;
  onDividendRatingChange?: (rating: string) => void;
  expensesRating?: string;
  onExpensesRatingChange?: (rating: string) => void;
  volatilityRating?: string;
  onVolatilityRatingChange?: (rating: string) => void;
}

export function IntelTable({
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
  onPageChange,
  dividendRating,
  onDividendRatingChange,
  expensesRating,
  onExpensesRatingChange,
  volatilityRating,
  onVolatilityRatingChange
}: IntelTableProps) {
  const [flyingItems, setFlyingItems] = React.useState<{ id: number; x: number; y: number; symbol: string }[]>([]);
  const [analyzingSymbol, setAnalyzingSymbol] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);

  const handleAddToWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();

    // Create flying animation
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
    setAnalyzingSymbol(row.symbol);

    const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
    const cacheKey = `ai-analysis-etf-${row.symbol}`;
    const cachedDataStr = localStorage.getItem(cacheKey);

    if (cachedDataStr) {
      try {
        const cachedData = JSON.parse(cachedDataStr);
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
          // Use cached analysis
          setAnalysisResult(cachedData.result);
          setAnalyzingSymbol(null);
          return;
        }
      } catch (err) {
        // Invalid cache JSON, ignore
        console.error("Failed to parse cached analysis", err);
      }
    }

    const etfData: EtfDetail = {
      symbol: row.symbol,
      name: row.etf_name || '',
      assetClass: row.asset_class || '',
      sector: row.sector || '',
      expenseRatio: row.expense_ratio ? Number(row.expense_ratio) : null,
      taxForm: row.tax_form || '',
      divYield: row.annual_dividend_yield_pct ? Number(row.annual_dividend_yield_pct) : null,
      totalAssets: row.total_assets ? Number(row.total_assets) : null,
      avgVolume: row.avg_daily_volume ? Number(row.avg_daily_volume) : null,
      rsi: row.rsi ? Number(row.rsi) : null,
      ytdPriceChange: row.ytd_price_change ? Number(row.ytd_price_change) : null,
      oneMonthPerf: row.one_month_perf ? Number(row.one_month_perf) : null,
      beta: row.beta ? Number(row.beta) : null,
      isLeveraged: row.is_leveraged || false,
      isInverse: row.is_inverse || false,
    };

    const res = await analyzeSelectedEtf(etfData);
    setAnalyzingSymbol(null);
    if (res.ok) {
      setAnalysisResult(res.data);
      // Save result to localStorage
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
              onClick={(e) => handleAddToWatchlist(e, row.original.symbol)}
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
              disabled={analyzingSymbol === row.original.symbol}
            >
              {analyzingSymbol === row.original.symbol ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        ),
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
                    <span className="text-xs font-normal text-gray-500">(${row.original.previous_closing_price})</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate" title={row.original.etf_name}>
                    {row.original.etf_name}
                  </span>
                </div>
              </div>
            ),
          },
          {
            accessorKey: "asset_class",
            header: "Asset Class",
            cell: ({ row }) => (
              <Badge variant="secondary" className="text-[9px] uppercase font-bold whitespace-nowrap">
                {row.original.asset_class || "N/A"}
              </Badge>
            ),
          },
          {
            accessorKey: "sector",
            header: "Sector",
            cell: ({ row }) => (
              <Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted/30 whitespace-nowrap">
                {row.original.sector || "N/A"}
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.expense_ratio;
              if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
              return (
                <span className="font-mono text-xs text-foreground font-medium">
                  {(Number(val) * 100).toFixed(2)}%
                </span>
              );
            }
          },
          {
            accessorKey: "expenses_rating",
            header: "Rating",
            cell: ({ row }) => (
              <RatingBadge rating={row.original.expenses_rating} />
            )
          },
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
            )
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.annual_dividend_yield_pct;
              if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
              return (
                <span className="font-mono text-xs text-emerald-500 font-bold">
                  {Number(val).toFixed(2)}%
                </span>
              );
            }
          },
          {
            accessorKey: "dividend_rating",
            header: "Rating",
            cell: ({ row }) => (
              <RatingBadge rating={row.original.dividend_rating} />
            )
          },
          {
            accessorKey: "last_dividend_amount",
            header: "Last Payout",
            cell: ({ row }) => {
              const val = row.original.last_dividend_amount;
              if (val == null) return <span className="font-mono text-xs text-muted-foreground">-</span>;
              return <span className="font-mono text-xs font-medium">${Number(val).toFixed(4)}</span>;
            }
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
              )
            },
            cell: ({ row }) => {
              const val = row.original.total_assets;
              if (val == null) return <span className="text-muted-foreground">-</span>;
              const assets = Number(val);
              const formatted = assets >= 1e9
                ? `$${(assets / 1e9).toFixed(1)}B`
                : `$${(assets / 1e6).toFixed(1)}M`;
              return <span className="font-mono text-xs font-medium">{formatted}</span>;
            }
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
            }
          },
          {
            accessorKey: "liquidity_rating",
            header: "Liquidity",
            cell: ({ row }) => (
              <RatingBadge rating={row.original.liquidity_rating} />
            )
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
              )
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
              )
            },
            cell: ({ row }) => <PercentCell value={row.original.ytd_price_change} />
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
              )
            },
            cell: ({ row }) => <PercentCell value={row.original.one_month_perf} />
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
            )
          },
          {
            accessorKey: "volatility_rating",
            header: "Volatility",
            cell: ({ row }) => (
              <RatingBadge rating={row.original.volatility_rating} />
            )
          },
          {
            accessorKey: "is_leveraged",
            header: "Lev",
            cell: ({ row }) => (
              row.original.is_leveraged ? (
                <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">YES</Badge>
              ) : <span className="text-[10px] text-muted-foreground">No</span>
            )
          },
          {
            accessorKey: "is_inverse",
            header: "Inv",
            cell: ({ row }) => (
              row.original.is_inverse ? (
                <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">YES</Badge>
              ) : <span className="text-[10px] text-muted-foreground">No</span>
            )
          },
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
    <div className="space-y-4 w-[75vw]">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/20 p-4 border border-border/50 rounded-lg backdrop-blur-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol or name..."
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

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Div:</span>
            <Select value={dividendRating} onValueChange={onDividendRatingChange}>
              <SelectTrigger className="w-[80px] bg-background/50 border-none h-8 text-[10px] font-black">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Exp:</span>
            <Select value={expensesRating} onValueChange={onExpensesRatingChange}>
              <SelectTrigger className="w-[80px] bg-background/50 border-none h-8 text-[10px] font-black">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Vol:</span>
            <Select value={volatilityRating} onValueChange={onVolatilityRatingChange}>
              <SelectTrigger className="w-[80px] bg-background/50 border-none h-8 text-[10px] font-black">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border border-border/50 bg-card/10 backdrop-blur-sm overflow-hidden rounded-none shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "text-[10px] uppercase font-black tracking-widest py-2 text-muted-foreground border-r border-border/10 last:border-r-0",
                        header.column.parent ? "h-8" : "h-10"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center",
                        !header.column.parent && "h-full"
                      )}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border/10 h-12">
                    <TableCell colSpan={25}>
                      <div className="h-4 bg-muted/20 w-full rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={selectedSymbol === row.original.symbol ? "selected" : ""}
                    className={cn(
                      "cursor-pointer transition-colors border-border/10 h-12 group/row",
                      selectedSymbol === row.original.symbol
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-muted/20"
                    )}
                    onClick={() => onSelectSymbol(row.original.symbol)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-0 border-r border-border/5 last:border-r-0 group-hover/row:border-border/10"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={25} className="h-24 text-center text-muted-foreground text-xs italic">
                    No ETFs found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

function RatingBadge({ rating }: { rating: string | null }) {
  if (!rating) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    "A": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "B": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "C": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "D": "bg-rose-500/10 text-rose-500 border-rose-500/20",
    "F": "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const colorClass = colors[rating.charAt(0)] || "bg-muted/50 text-muted-foreground border-muted/50";

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black w-6 h-6 p-0 flex items-center justify-center rounded-sm", colorClass)}>
      {rating}
    </Badge>
  );
}

function PercentCell({ value }: { value: number | null }) {
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
