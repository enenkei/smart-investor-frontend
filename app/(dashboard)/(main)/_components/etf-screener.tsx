"use client";

import * as React from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { VisualizationLayer } from "@/app/(dashboard)/(main)/_components/screener/visualization-layer";
import { IntelTable } from "@/app/(dashboard)/(main)/_components/screener/intel-table";
import {
    EtfFilterBar,
    EtfFilterState,
    DEFAULT_ETF_FILTERS,
} from "@/app/(dashboard)/(main)/_components/screener/etf-filter-bar";
import { getETFs, getETFSectors } from "@/controllers/stock-data-controller";
import { Scale, Layers, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComparisonDialog } from "@/app/(dashboard)/(main)/_components/screener/comparison-dialog";
import { EtfOverlapDialog } from "@/app/(dashboard)/(main)/_components/screener/etf-overlap-dialog";
import { DividendSnowballDialog } from "@/app/(dashboard)/(main)/_components/screener/dividend-snowball-dialog";

const EtfScreener = () => {
    const [search, setSearch] = React.useState("");
    const [sector, setSector] = React.useState("All");
    const [page, setPage] = React.useState(1);
    const limit = 10;

    const [filters, setFilters] = React.useState<EtfFilterState>(DEFAULT_ETF_FILTERS);
    const [activePresetId, setActivePresetId] = React.useState<string | null>(null);

    const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);
    const [compareOpen, setCompareOpen] = React.useState(false);
    const [compareSymbolA, setCompareSymbolA] = React.useState<string | undefined>(undefined);
    const [overlapOpen, setOverlapOpen] = React.useState(false);
    const [overlapInitialSymbol, setOverlapInitialSymbol] = React.useState<string | undefined>(undefined);

    const [snowballOpen, setSnowballOpen] = React.useState(false);
    const [snowballTicker, setSnowballTicker] = React.useState<string | undefined>(undefined);
    const [snowballYield, setSnowballYield] = React.useState<number | undefined>(undefined);
    const [snowballCagr, setSnowballCagr] = React.useState<number | undefined>(undefined);

    // Initial load: Sectors
    const { data: sectors = [] } = useQuery({
        queryKey: ["etfs", "sectors"],
        queryFn: () => getETFSectors(),
        staleTime: 1000 * 60 * 60,
    });

    const handleFilterChange = (key: keyof EtfFilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setActivePresetId(null);
        setPage(1);
    };

    const handleApplyPreset = (presetId: string, presetFilters: Partial<EtfFilterState>) => {
        setFilters({ ...DEFAULT_ETF_FILTERS, ...presetFilters });
        setActivePresetId(presetId);
        setPage(1);
    };

    const handleResetFilters = () => {
        setFilters(DEFAULT_ETF_FILTERS);
        setActivePresetId(null);
        setSearch("");
        setSector("All");
        setPage(1);
    };

    const queryParams = React.useMemo(() => ({
        page,
        limit,
        search,
        sector,
        maxExpense: filters.maxExpense !== "any" ? Number(filters.maxExpense) : undefined,
        isLeveraged: filters.isLeveraged !== "any" ? filters.isLeveraged === "true" : undefined,
        isInverse: filters.isInverse !== "any" ? filters.isInverse === "true" : undefined,
        minYield: filters.minYield !== "any" ? Number(filters.minYield) : undefined,
        dividendRating: filters.dividendRating !== "All" ? filters.dividendRating : undefined,
        rsiMode: filters.rsiMode !== "any" ? filters.rsiMode : undefined,
        beta: filters.beta !== "any" ? filters.beta : undefined,
        volatilityRating: filters.volatilityRating !== "All" ? filters.volatilityRating : undefined,
        minAssets: filters.minAssets !== "any" ? Number(filters.minAssets) : undefined,
        expensesRating: filters.expensesRating !== "All" ? filters.expensesRating : undefined,
        liquidityRating: filters.liquidityRating !== "All" ? filters.liquidityRating : undefined,
    }), [page, limit, search, sector, filters]);

    // Fetch data when search, sector, filters, or page changes
    const { data: etfResult, isLoading } = useQuery({
        queryKey: ["etfs", queryParams],
        queryFn: () => getETFs(queryParams),
        placeholderData: keepPreviousData,
    });

    const data = etfResult?.etfs ?? [];
    const totalResults = etfResult?.total ?? 0;
    const totalPages = etfResult?.totalPages ?? 0;
    const loading = isLoading;

    const handleSelectSymbol = (symbol: string) => {
        setSelectedSymbol(selectedSymbol === symbol ? null : symbol);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="flex h-full bg-background overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">ETF Screener</h1>
                        <p className="text-muted-foreground">
                            Discover high-yield, oversold ETFs with tax-efficient structures.
                            Showing <span className="text-foreground font-bold">{totalResults}</span> results.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
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
                                setOverlapInitialSymbol(undefined);
                                setOverlapOpen(true);
                            }}
                            className="flex items-center gap-2 border-sky-500/40 hover:border-sky-500/80 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 font-bold text-xs uppercase tracking-wider h-10 px-3.5 shadow-sm"
                        >
                            <Layers className="w-4 h-4 text-sky-400" />
                            <span>Overlap Auditor</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setCompareSymbolA(undefined);
                                setCompareOpen(true);
                            }}
                            className="flex items-center gap-2 border-primary/40 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider h-10 px-3.5 shadow-sm"
                        >
                            <Scale className="w-4 h-4 text-primary" />
                            <span>Head-to-Head Duel</span>
                        </Button>
                    </div>
                </div>

                {/* Finviz-Style ETF Filter Bar & Presets */}
                <EtfFilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onApplyPreset={handleApplyPreset}
                    onResetFilters={handleResetFilters}
                    activePresetId={activePresetId}
                />

                {/* Visualization Section */}
                <section className={loading ? "opacity-50 pointer-events-none" : ""}>
                    <VisualizationLayer
                        data={data}
                        onSelectSymbol={handleSelectSymbol}
                        selectedSymbol={selectedSymbol}
                        totalResults={totalResults}
                    />
                </section>

                {/* Data Table Section */}
                <section className="py-3">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            The "Intel" Data Grid
                        </h2>
                        <div className="flex gap-2">
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Oversold (RSI &lt; 35)
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Overbought (RSI &gt; 65)
                            </div>
                        </div>
                    </div>
                    <IntelTable
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
                        onAuditOverlap={(sym) => {
                            setOverlapInitialSymbol(sym);
                            setOverlapOpen(true);
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

            {/* ETF Overlap & Concentration Auditor Dialog */}
            <EtfOverlapDialog
                open={overlapOpen}
                onOpenChange={setOverlapOpen}
                initialSymbol={overlapInitialSymbol}
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

export default EtfScreener;