"use client";

import * as React from "react";
import { Sp500FilterSidebar } from "@/app/(dashboard)/(main)/_components/screener/sp-500-filter-sidebar";
import { Sp500Visualization } from "@/app/(dashboard)/(main)/_components/screener/sp-500-visualization";
import { Sp500IntelTable } from "@/app/(dashboard)/(main)/_components/screener/sp-500-intel-table";
import { getStocksSectors, getStocks } from "@/controllers/stock-data-controller";
import { Target, TrendingDown, Zap } from "lucide-react";

const StocksScreener = () => {
    const [filters, setFilters] = React.useState({
        minYield: 0,
        minCagr: 0,
        maxPayout: 100,
        maxPe: 50,
        minFcfYield: 0,
        maxRsi: 100,
        dist52wLow: "all",
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
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Initial load: Sectors
    React.useEffect(() => {
        getStocksSectors().then(setSectors);
    }, []);

    // Fetch data when filters or pagination change
    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const result = await getStocks({
                page,
                limit,
                search,
                sector,
                minYield: filters.minYield,
                minCagr: filters.minCagr,
                maxPayout: filters.maxPayout,
                maxPe: filters.maxPe,
                minFcfYield: filters.minFcfYield,
                maxRsi: filters.maxRsi
            });
            setData(result.stocks);
            setTotalResults(result.total);
            setTotalPages(result.totalPages);
            setLoading(false);
        };
        fetchData();
    }, [filters, search, sector, page, limit]);

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
            <Sp500FilterSidebar
                filters={filters}
                onFilterChange={(f) => { setFilters(f); setPage(1); }}
            />
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-none border border-primary/20">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">The Hunter Screener</h1>
                            <p className="text-muted-foreground font-medium text-sm">
                                Identifying high-quality value plays with technical momentum confirmation.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-card/40 border border-border/50 px-4 py-2 flex items-center gap-3">
                            <div className="text-2xl font-black text-primary">{totalResults}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">
                                Opportunities<br />Located
                            </div>
                        </div>
                        <div className="bg-card/40 border border-border/50 px-4 py-2 flex items-center gap-3">
                            <div className="text-2xl font-black text-emerald-500">
                                {data.filter(s => (s.quality_score || 0) > 80 && (s.rsi || 0) < 35).length}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">
                                "Double Green"<br />Signals
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visualization Section */}
                <section className={loading ? "opacity-50 pointer-events-none" : "animate-in fade-in slide-in-from-top-4 duration-700 bg-card/10 p-6 border border-border/30 rounded-none"}>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Strategic Overlay</h2>
                    </div>
                    <Sp500Visualization
                        data={data}
                        onSelectSymbol={handleSelectSymbol}
                        selectedSymbol={selectedSymbol}
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
                    />
                </section>
            </div>
        </div>
    );
};

export default StocksScreener;