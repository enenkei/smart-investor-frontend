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
import { cn } from "@/lib/utils";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Sparkles,
  X,
} from "lucide-react";
import { addToWatchlist } from "@/controllers/stock-data-controller";
import { analyzeSelectedStock, StockDetail } from "@/controllers/ai-controller";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getSp500IntelTableColumns } from "./sp-500-intel-table-columns";
import { AnalysisDialog } from "./analysis-dialog";

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
  onCompare?: (symbol: string) => void;
  onSimulateSnowball?: (symbol: string, divYield?: number, divCagr?: number) => void;
}

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
  onPageChange,
  onCompare,
  onSimulateSnowball,
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
      marketCap: row.market_cap ? Number(row.market_cap) : null,
      price: row.prev_close ? Number(row.prev_close) : (row.current_price ? Number(row.current_price) : null),
      oneDayChange: row.one_day_change ? Number(row.one_day_change) : null,
      totalReturn: row.total_return ? Number(row.total_return) : null,
      peRatio: row.pe_ratio ? Number(row.pe_ratio) : null,
      fcfYield: row.fcf_yield ? Number(row.fcf_yield) : null,
      operatingMargins: row.operating_margins ? Number(row.operating_margins) : null,
      roe: row.roe ? Number(row.roe) : null,
      revenueGrowth: row.revenue_growth ? Number(row.revenue_growth) : null,
      epsGrowth5y: row.eps_growth_5y ? Number(row.eps_growth_5y) : null,
      deRatio: row.de_ratio ? Number(row.de_ratio) : null,
      currentRatio: row.current_ratio ? Number(row.current_ratio) : null,
      divYield: row.dividend_yield ? Number(row.dividend_yield) : null,
      divCagr5y: row.dividend_cagr_5y ? Number(row.dividend_cagr_5y) : null,
      payoutRatio: row.payout_ratio ? Number(row.payout_ratio) : null,
      rsi: row.rsi ? Number(row.rsi) : null,
      beta: row.beta ? Number(row.beta) : null,
      qualityScore: row.quality_score ? Number(row.quality_score) : null,
      growthScore: row.growth_score ? Number(row.growth_score) : null,
      incomeScore: row.income_score ? Number(row.income_score) : null,
      safetyMetric: row.safety_metric ? Number(row.safety_metric) : null,
      adaptiveScore: row.adaptive_total_score ? Number(row.adaptive_total_score) : null,
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
    () =>
      getSp500IntelTableColumns({
        onAddToWatchlist: handleAddToWatchlist,
        onAnalyze: handleAnalyze,
        onCompare,
        onSimulateSnowball,
        analyzingSymbol,
      }),
    [analyzingSymbol, onCompare, onSimulateSnowball]
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
        <div className="relative w-full md:w-[48%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search ticker or company..."
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
