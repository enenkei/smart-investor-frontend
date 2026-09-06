import { useState, useMemo, useTransition, useCallback } from "react";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import {
    deleteAsset,
    deleteMultipleWatchlistItems,
    clearWatchlist,
} from "@/lib/actions/assets";
import { toast } from "sonner";
import React from "react";
import {
    EnrichedWatchlistItem,
    SortField,
    SortDirection,
    TypeFilter,
    WatchlistProps,
    ConfirmDialogState,
} from "./types";

export function useWatchlist({
    selectedSymbols,
    onSelectionChange,
    watchlist: externalWatchlist,
    searchQuery: externalSearchQuery,
    handleDelete: externalHandleDelete,
    handleDeleteSelected: externalHandleDeleteSelected,
    handleClearAll: externalHandleClearAll,
    isPending: externalIsPending,
}: WatchlistProps) {
    const { watchlist: storeWatchlist, fetchWatchlist } = usePortfolioStore();
    const rawWatchlist = (externalWatchlist ?? storeWatchlist) as EnrichedWatchlistItem[];

    const [internalPending, startTransition] = useTransition();
    const isPending = externalIsPending ?? internalPending;

    const [internalSearchQuery, setInternalSearchQuery] = useState("");
    const searchQuery = externalSearchQuery ?? internalSearchQuery;
    const setSearchQuery = setInternalSearchQuery;

    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        open: false,
        title: "",
        description: null,
        confirmText: "",
        action: () => {},
    });

    const stockCount = useMemo(
        () => rawWatchlist.filter((w) => w.type === "Stock").length,
        [rawWatchlist]
    );
    const etfCount = useMemo(
        () => rawWatchlist.filter((w) => w.type === "ETF").length,
        [rawWatchlist]
    );

    // Sorting toggle handler
    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                if (sortDirection === "asc") {
                    setSortDirection("desc");
                } else {
                    setSortField(null);
                    setSortDirection("asc");
                }
            } else {
                setSortField(field);
                setSortDirection("asc");
            }
        },
        [sortField, sortDirection]
    );

    // Filter & sort assets
    const filteredAssets = useMemo(() => {
        let result = rawWatchlist;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(
                (w) =>
                    w.symbol.toLowerCase().includes(q) ||
                    (w.sector && w.sector.toLowerCase().includes(q))
            );
        }

        if (typeFilter !== "all") {
            result = result.filter((w) => w.type === typeFilter);
        }

        if (sortField) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortField];
                let bVal = b[sortField];

                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                if (typeof aVal === "string" && typeof bVal === "string") {
                    const cmp = aVal.localeCompare(bVal);
                    return sortDirection === "asc" ? cmp : -cmp;
                }

                if (typeof aVal === "number" && typeof bVal === "number") {
                    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
                }

                return 0;
            });
        }

        return result;
    }, [rawWatchlist, searchQuery, typeFilter, sortField, sortDirection]);

    // Selection handlers
    const isAllSelected = useMemo(
        () =>
            filteredAssets.length > 0 &&
            filteredAssets.every((a) => selectedSymbols.includes(a.symbol)),
        [filteredAssets, selectedSymbols]
    );

    const toggleAll = useCallback(
        (checked: boolean) => {
            const filteredSymbols = filteredAssets.map((w) => w.symbol);
            if (checked) {
                const combined = Array.from(new Set([...selectedSymbols, ...filteredSymbols]));
                onSelectionChange(combined);
            } else {
                onSelectionChange(selectedSymbols.filter((s) => !filteredSymbols.includes(s)));
            }
        },
        [filteredAssets, selectedSymbols, onSelectionChange]
    );

    const toggleOne = useCallback(
        (symbol: string, checked: boolean) => {
            if (checked) {
                onSelectionChange([...selectedSymbols, symbol]);
            } else {
                onSelectionChange(selectedSymbols.filter((s) => s !== symbol));
            }
        },
        [selectedSymbols, onSelectionChange]
    );

    // Delete actions
    const performDeleteOne = useCallback(
        (symbol: string) => {
            if (externalHandleDelete) {
                externalHandleDelete(symbol);
                return;
            }
            startTransition(async () => {
                try {
                    await deleteAsset(symbol);
                    await fetchWatchlist();
                    onSelectionChange(selectedSymbols.filter((s) => s !== symbol));
                    toast.success(`${symbol} removed from watchlist`);
                } catch {
                    toast.error(`Failed to remove ${symbol}`);
                }
            });
        },
        [externalHandleDelete, fetchWatchlist, onSelectionChange, selectedSymbols]
    );

    const performDeleteSelected = useCallback(() => {
        if (selectedSymbols.length === 0) return;
        if (externalHandleDeleteSelected) {
            externalHandleDeleteSelected();
            return;
        }
        startTransition(async () => {
            try {
                await deleteMultipleWatchlistItems(selectedSymbols);
                await fetchWatchlist();
                onSelectionChange([]);
                toast.success(`${selectedSymbols.length} assets removed`);
            } catch {
                toast.error("Failed to remove selected assets");
            }
        });
    }, [selectedSymbols, externalHandleDeleteSelected, fetchWatchlist, onSelectionChange]);

    const performClearAll = useCallback(() => {
        if (externalHandleClearAll) {
            externalHandleClearAll();
            return;
        }
        startTransition(async () => {
            try {
                await clearWatchlist();
                await fetchWatchlist();
                onSelectionChange([]);
                toast.success("Watchlist cleared");
            } catch {
                toast.error("Failed to clear watchlist");
            }
        });
    }, [externalHandleClearAll, fetchWatchlist, onSelectionChange]);

    // Dialog prompts
    const requestDeleteOne = useCallback(
        (symbol: string) => {
            setConfirmDialog({
                open: true,
                title: `Remove ${symbol}`,
                description: React.createElement(
                    "span",
                    null,
                    "Are you sure you want to remove ",
                    React.createElement(
                        "strong",
                        { className: "text-foreground font-bold" },
                        symbol
                    ),
                    " from your watchlist?"
                ),
                confirmText: "Remove",
                action: () => performDeleteOne(symbol),
            });
        },
        [performDeleteOne]
    );

    const requestDeleteSelected = useCallback(() => {
        if (selectedSymbols.length === 0) return;
        setConfirmDialog({
            open: true,
            title: "Remove Selected Assets",
            description: React.createElement(
                "span",
                null,
                "Are you sure you want to remove ",
                React.createElement(
                    "strong",
                    { className: "text-foreground font-bold" },
                    `${selectedSymbols.length} selected asset${
                        selectedSymbols.length > 1 ? "s" : ""
                    }`
                ),
                " from your watchlist?"
            ),
            confirmText: `Remove (${selectedSymbols.length})`,
            action: performDeleteSelected,
        });
    }, [selectedSymbols.length, performDeleteSelected]);

    const requestClearAll = useCallback(() => {
        setConfirmDialog({
            open: true,
            title: "Clear Watchlist",
            description: React.createElement(
                "span",
                null,
                "Are you sure you want to remove ",
                React.createElement(
                    "strong",
                    { className: "text-foreground font-bold" },
                    "ALL assets"
                ),
                " from your watchlist? This action cannot be undone."
            ),
            confirmText: "Confirm Clear All",
            action: performClearAll,
        });
    }, [performClearAll]);

    const closeConfirm = useCallback(() => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
    }, []);

    return {
        rawWatchlist,
        filteredAssets,
        searchQuery,
        setSearchQuery,
        typeFilter,
        setTypeFilter,
        sortField,
        sortDirection,
        handleSort,
        stockCount,
        etfCount,
        isAllSelected,
        toggleAll,
        toggleOne,
        isPending,
        confirmDialog,
        setConfirmDialog,
        requestDeleteOne,
        requestDeleteSelected,
        requestClearAll,
        closeConfirm,
    };
}
