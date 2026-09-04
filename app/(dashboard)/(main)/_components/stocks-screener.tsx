"use client";

import * as React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Sp500Visualization } from "@/app/(dashboard)/(main)/_components/screener/sp-500-visualization";
import { Sp500IntelTable } from "@/app/(dashboard)/(main)/_components/screener/sp-500-intel-table";
import {
    Sp500FilterBar,
    StockFilterState,
    DEFAULT_FILTERS,
} from "@/app/(dashboard)/(main)/_components/screener/sp-500-filter-bar";
import { getStocksSectors, getStocks } from "@/controllers/stock-data-controller";
import { Target, TrendingDown, Scale, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonDialog } from "@/app/(dashboard)/(main)/_components/screener/comparison-dialog";
import { DividendSnowballDialog } from "@/app/(dashboard)/(main)/_components/screener/dividend-snowball-dialog";

const StocksScreener = () => {
    const [search, setSearch] = React.useState("");
    const [sector, setSector] = React.useState("All");
    const [page, setPage] = React.useState(1);
    const limit = 10;

    const [filters, setFilters] = React.useState<StockFilterState>(DEFAULT_FILTERS);
    const [activePresetId, setActivePresetId] = React.useState<string | null>(null);

    const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);
    const [compareOpen, setCompareOpen] = React.useState(false);
    const [compareSymbolA, setCompareSymbolA] = React.useState<string | undefined>(undefined);

    const [snowballOpen, setSnowballOpen] = React.useState(false);
    const [snowballTicker, setSnowballTicker] = React.useState<string | undefined>(undefined);
    const [snowballYield, setSnowballYield] = React.useState<number | undefined>(undefined);
    const [snowballCagr, setSnowballCagr] = React.useState<number | undefined>(undefined);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Initial load: Sectors
    const { data: sectors = [] } = useQuery({
        queryKey: ["stocks", "sectors"],
        queryFn: () => getStocksSectors(),
        staleTime: 1000 * 60 * 60,
    });

    const handleFilterChange = (key: keyof StockFilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setActivePresetId(null);
        setPage(1);
    };

    const handleApplyPreset = (presetId: string, presetFilters: Partial<StockFilterState>) => {
        setFilters({ ...DEFAULT_FILTERS, ...presetFilters });
        setActivePresetId(presetId);
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setActivePresetId(null);
        setPage(1);
    };

    const queryParams = React.useMemo(() => ({
        page,
        limit,
        search,
        sector,
        maxPe: filters.maxPe !== "any" ? Number(filters.maxPe) : undefined,
        minFcfYield: filters.minFcfYield !== "any" ? Number(filters.minFcfYield) : undefined,
        maxDe: filters.maxDe !== "any" ? Number(filters.maxDe) : undefined,
        minYield: filters.minYield !== "any" ? Number(filters.minYield) : undefined,
        minCagr: filters.minCagr !== "any" ? Number(filters.minCagr) : undefined,
        maxPayout: filters.maxPayout !== "any" ? Number(filters.maxPayout) : undefined,
        rsiMode: filters.rsiMode !== "any" ? filters.rsiMode : undefined,
        beta: filters.beta !== "any" ? filters.beta : undefined,
        minQuality: filters.minQuality !== "any" ? Number(filters.minQuality) : undefined,
        minMargin: filters.minMargin !== "any" ? Number(filters.minMargin) : undefined,
    }), [page, limit, search, sector, filters]);

    // Fetch data when search, sector, filters, or page changes
    const { data: stocksResult, isLoading } = useQuery({
        queryKey: ["stocks", queryParams],
        queryFn: () => getStocks(queryParams),
        placeholderData: keepPreviousData,
    });

    const data = stocksResult?.stocks ?? [];
    const totalResults = stocksResult?.total ?? 0;
    const totalPages = stocksResult?.totalPages ?? 0;
    const loading = isLoading;

    const handleSelectSymbol = (symbol: string) => {
        setSelectedSymbol(selectedSymbol === symbol ? null : symbol);

        // Scroll to the row within the local container
        if (selectedSymbol !== symbol) {
            setTimeout(() => {
                const element = document.getElementById(`stock-row-${symbol}`);
                if (element && scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const elementRect = element.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const relativeTop = elementRect.top - containerRect.top + container.scrollTop;

                    container.scrollTo({
                        top: relativeTop - containerRect.height / 2 + elementRect.height / 2,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="flex h-full bg-background overflow-hidden">
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-none border border-primary/20">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">The Hunter Screener</h1>
                            <p className="text-muted-foreground font-medium text-sm">
                                Identifying high-quality value plays with technical momentum confirmation.
                                Showing <span className="text-foreground font-bold">{totalResults}</span> results.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSnowballTicker(undefined);
                                setSnowballYield(undefined);
                                setSnowballCagr(undefined);
                                setSnowballOpen(true);
                            }}
                            className="flex items-center gap-2 border-emerald-500/40 hover:border-emerald-500/80 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase tracking-wider h-10 px-3.5 shadow-sm"
                        >
                            <Coins className="w-4 h-4 text-emerald-500" />
                            <span>Dividend Snowball</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setCompareSymbolA(undefined);
                                setCompareOpen(true);
                            }}
                            className="flex items-center gap-2 border-primary/40 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider h-10 px-4 shadow-sm"
                        >
                            <Scale className="w-4 h-4 text-primary" />
                            <span>Head-to-Head Duel</span>
                        </Button>
                    </div>
                </div>

                {/* Finviz-Style Screener Filter Bar & Presets */}
                <Sp500FilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyPreset={handleApplyPreset}
                    onResetFilters={handleResetFilters}
                    activePresetId={activePresetId}
                />

                {/* Visualization Section */}
                <section className={loading ? "opacity-50 pointer-events-none" : ""}>
                    <Sp500Visualization
                        data={data}
                        onSelectSymbol={handleSelectSymbol}
                        selectedSymbol={selectedSymbol}
                        totalResults={totalResults}
                    />
                </section>

                {/* Data Table Section */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">The Intelligence Grid</h2>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500">Hunter Priority Target</span>
                            </div>
                        </div>
                    </div>

                    <Sp500IntelTable
                        data={data}
                        loading={loading}
                        selectedSymbol={selectedSymbol}
                        onSelectSymbol={handleSelectSymbol}
                        search={search}
                        onSearchChange={(s) => { setSearch(s); setPage(1); }}
                        sector={sector}
                        onSectorChange={(s) => { setSector(s); setPage(1); }}
                        sectors={sectors}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onCompare={(sym) => {
                            setCompareSymbolA(sym);
                            setCompareOpen(true);
                        }}
                        onSimulateSnowball={(sym, yld, cagr) => {
                            setSnowballTicker(sym);
                            setSnowballYield(yld);
                            setSnowballCagr(cagr);
                            setSnowballOpen(true);
                        }}
                    />
                </section>
            </div>

            {/* Head-to-Head Comparison Dialog */}
            <ComparisonDialog
                open={compareOpen}
                onOpenChange={setCompareOpen}
                initialSymbolA={compareSymbolA}
            />

            {/* Dividend Snowball / DRIP Simulator Dialog */}
            <DividendSnowballDialog
                open={snowballOpen}
                onOpenChange={setSnowballOpen}
                initialTicker={snowballTicker}
                initialYield={snowballYield}
                initialDivCagr={snowballCagr}
            />
        </div>
    );
};

export default StocksScreener;