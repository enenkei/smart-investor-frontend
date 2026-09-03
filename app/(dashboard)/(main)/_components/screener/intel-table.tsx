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
import { AnalysisDialog } from "./analysis-dialog";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import { addToWatchlist } from "@/controllers/stock-data-controller";
import { analyzeSelectedEtf, EtfDetail } from "@/controllers/ai-controller";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getIntelTableColumns } from "./intel-table-columns";

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
  onCompare?: (symbol: string) => void;
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
  onCompare,
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
      category: row.etf_database_category || row.category || row.sector || '',
      price: row.previous_closing_price ? Number(row.previous_closing_price) : null,
      oneDayChange: row.one_day_change ? Number(row.one_day_change) : null,
      oneMonthPerf: row.one_month_perf ? Number(row.one_month_perf) : null,
      ytdPriceChange: row.ytd_price_change ? Number(row.ytd_price_change) : null,
      oneYearPerf: row.one_year_perf ? Number(row.one_year_perf) : null,
      threeYearPerf: row.three_year_perf ? Number(row.three_year_perf) : null,
      fiveYearPerf: row.five_year_perf ? Number(row.five_year_perf) : null,
      expenseRatio: row.expense_ratio ? Number(row.expense_ratio) : null,
      taxForm: row.tax_form || '',
      divYield: row.annual_dividend_yield_pct ? Number(row.annual_dividend_yield_pct) : null,
      peRatio: row.pe_ratio ? Number(row.pe_ratio) : null,
      totalAssets: row.total_assets ? Number(row.total_assets) : null,
      avgVolume: row.avg_daily_volume ? Number(row.avg_daily_volume) : null,
      numOfHoldings: row.num_of_holdings ? Number(row.num_of_holdings) : null,
      pctInTop10: row.pct_in_top_10 ? Number(row.pct_in_top_10) : null,
      rsi: row.rsi ? Number(row.rsi) : null,
      beta: row.beta ? Number(row.beta) : null,
      expensesRating: row.expenses_rating || null,
      dividendRating: row.dividend_rating || null,
      volatilityRating: row.volatility_rating || null,
      liquidityRating: row.liquidity_rating || null,
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
    () =>
      getIntelTableColumns({
        onAddToWatchlist: handleAddToWatchlist,
        onAnalyze: handleAnalyze,
        onCompare,
        analyzingSymbol,
      }),
    [analyzingSymbol, onCompare]
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
    <div className="space-y-4 w-full">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/20 p-4 border border-border/50 rounded-lg backdrop-blur-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search symbol or name..."
            className="pl-9 pr-8 bg-background/50 border-none h-9 text-xs"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <Select value={sector} onValueChange={onSectorChange}>
            <SelectTrigger className="w-full md:w-[220px] bg-background/50 border-none h-9 text-xs">
              <SelectValue placeholder="All Sectors & Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="All">All Sectors & Categories</SelectItem>
              {sectors.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <AnalysisDialog
        open={!!analysisResult || !!analyzingSymbol}
        onOpenChange={(open) => {
          if (!open) {
            setAnalysisResult(null);
            setAnalyzingSymbol(null);
          }
        }}
        analysisResult={analysisResult}
        analyzingSymbol={analyzingSymbol}
      />
    </div>
  );
}
