import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Trash2, Eraser, Loader2, FolderPlus } from "lucide-react";
import { TypeFilter } from "./types";

interface WatchlistToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    typeFilter: TypeFilter;
    onTypeFilterChange: (filter: TypeFilter) => void;
    totalCount: number;
    stockCount: number;
    etfCount: number;
    selectedCount: number;
    isPending: boolean;
    onDeleteSelected: () => void;
    onClearAll: () => void;
    onCreatePortfolio?: () => void;
}

export function WatchlistToolbar({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    totalCount,
    stockCount,
    etfCount,
    selectedCount,
    isPending,
    onDeleteSelected,
    onClearAll,
    onCreatePortfolio,
}: WatchlistToolbarProps) {
    const filterOptions: { label: string; value: TypeFilter; count: number }[] = [
        { label: "All", value: "all", count: totalCount },
        { label: "Stocks", value: "Stock", count: stockCount },
        { label: "ETFs", value: "ETF", count: etfCount },
    ];

    return (
        <div className="flex flex-col gap-2.5 p-3 border-b border-border/50 bg-muted/10">
            {/* Search Bar */}
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <Input
                    placeholder="Search ticker or sector..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 pr-8 h-8 rounded-none bg-background/40 border-border/50 text-xs placeholder:text-muted-foreground/50"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Filter Chips & Action Controls */}
            <div className="flex items-center justify-between gap-2">
                {/* Type Filter Chips */}
                <div className="flex items-center gap-1">
                    {filterOptions.map((opt) => {
                        const active = typeFilter === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => onTypeFilterChange(opt.value)}
                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 transition-colors border ${
                                    active
                                        ? "bg-primary/20 text-primary border-primary/40"
                                        : "bg-transparent text-muted-foreground/70 border-transparent hover:text-foreground hover:bg-muted/30"
                                }`}
                            >
                                {opt.label} ({opt.count})
                            </button>
                        );
                    })}
                </div>

                {/* Batch Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                    {selectedCount > 0 && onCreatePortfolio && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onCreatePortfolio}
                            className="h-6 px-2.5 rounded-none font-black text-[9px] uppercase tracking-widest gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            title="Create portfolio with selected tickers"
                        >
                            <FolderPlus className="w-3 h-3" />
                            Create ({selectedCount})
                        </Button>
                    )}

                    {selectedCount > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onDeleteSelected}
                            disabled={isPending}
                            className="h-6 px-2 rounded-none font-black text-[9px] uppercase tracking-widest gap-1"
                        >
                            {isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Trash2 className="w-3 h-3" />
                            )}
                            Remove ({selectedCount})
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        disabled={isPending || totalCount === 0}
                        className="h-6 px-2 rounded-none font-bold text-[9px] uppercase tracking-widest gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                        <Eraser className="w-3 h-3" />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
