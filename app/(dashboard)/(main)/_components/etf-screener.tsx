"use client";

import * as React from "react";
import { FilterSidebar } from "@/app/(dashboard)/(main)/_components/screener/filter-sidebar";
import { VisualizationLayer } from "@/app/(dashboard)/(main)/_components/screener/visualization-layer";
import { IntelTable } from "@/app/(dashboard)/(main)/_components/screener/intel-table";
import { getETFs, getETFSectors } from "@/controllers/stock-data-controller";

const EtfScreener = () => {
    const [filters, setFilters] = React.useState({
        minYield: 0,
        maxRsi: 100,
        maxExpense: 2.0,
        assetClasses: ["Equity", "Fixed Income", "Commodities", "Specialty"],
        dividendRating: "All",
        expensesRating: "All",
        volatilityRating: "All",
    });

    const [search, setSearch] = React.useState("");
    const [sector, setSector] = React.useState("All");
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(10);
    const [totalResults, setTotalResults] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(0);
    const [sectors, setSectors] = React.useState<string[]>([]);

    const [data, setData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);

    // Initial load: Sectors
    React.useEffect(() => {
        getETFSectors().then(setSectors);
    }, []);

    // Fetch data when filters or pagination change
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getETFs({
                page,
                limit,
                search,
                sector,
                minYield: filters.minYield,
                maxRsi: filters.maxRsi,
                maxExpense: filters.maxExpense,
                assetClasses: filters.assetClasses,
                dividendRating: filters.dividendRating,
                expensesRating: filters.expensesRating,
                volatilityRating: filters.volatilityRating
            });
            setData(result.etfs);
            setTotalResults(result.total);
            setTotalPages(result.totalPages);
            setLoading(false);
        };
        fetchData();
    }, [filters, search, sector, page, limit]);

    const handleSelectSymbol = (symbol: string) => {
        setSelectedSymbol(selectedSymbol === symbol ? null : symbol);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="flex h-full bg-background overflow-hidden">
            <FilterSidebar filters={filters} onFilterChange={(f) => { setFilters(f); setPage(1); }} />
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">ETF Screener</h1>
                    <p className="text-muted-foreground">
                        Discover high-yield, oversold ETFs with tax-efficient structures.
                        Showing <span className="text-foreground font-bold">{totalResults}</span> results.
                    </p>
                </div>

                {/* Visualization Section */}
                <section className={loading ? "opacity-50 pointer-events-none" : ""}>
                    <VisualizationLayer
                        data={data}
                        onSelectSymbol={handleSelectSymbol}
                        selectedSymbol={selectedSymbol}
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
                        dividendRating={filters.dividendRating}
                        onDividendRatingChange={(r) => setFilters(prev => ({ ...prev, dividendRating: r, page: 1 }))}
                        expensesRating={filters.expensesRating}
                        onExpensesRatingChange={(r) => setFilters(prev => ({ ...prev, expensesRating: r, page: 1 }))}
                        volatilityRating={filters.volatilityRating}
                        onVolatilityRatingChange={(r) => setFilters(prev => ({ ...prev, volatilityRating: r, page: 1 }))}
                    />
                </section>
            </div>
        </div>
    );
};

export default EtfScreener;