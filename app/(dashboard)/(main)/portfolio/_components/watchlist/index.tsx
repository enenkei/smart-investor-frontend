import React from "react";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { WatchlistProps, SortField } from "./types";
import { useWatchlist } from "./use-watchlist";
import { WatchlistRow } from "./watchlist-row";
import { WatchlistToolbar } from "./watchlist-toolbar";
import { WatchlistEmpty } from "./watchlist-empty";

export function WatchlistComponent(props: WatchlistProps) {
    const {
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
    } = useWatchlist(props);

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-80 transition-opacity" />;
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3 text-primary" />
        ) : (
            <ArrowDown className="w-3 h-3 text-primary" />
        );
    };

    return (
        <div className="flex flex-col w-full">
            {/* Toolbar: Search, Filters, Batch Actions */}
            <WatchlistToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                totalCount={rawWatchlist.length}
                stockCount={stockCount}
                etfCount={etfCount}
                selectedCount={props.selectedSymbols.length}
                isPending={isPending}
                onDeleteSelected={requestDeleteSelected}
                onClearAll={requestClearAll}
                onCreatePortfolio={props.onCreatePortfolio}
            />

            {/* Scrollable Table Area */}
            <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                <Table>
                    <TableHeader className="bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-10 px-2">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => toggleAll(!!checked)}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead
                                className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                onClick={() => handleSort("symbol")}
                            >
                                <div className="flex items-center gap-1 group">
                                    <span>Ticker</span>
                                    {renderSortIcon("symbol")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                onClick={() => handleSort("sector")}
                            >
                                <div className="flex items-center gap-1 group">
                                    <span>Sector</span>
                                    {renderSortIcon("sector")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-[10px] font-black uppercase text-muted-foreground text-right cursor-pointer hover:text-foreground select-none"
                                onClick={() => handleSort("currentPrice")}
                            >
                                <div className="flex items-center justify-end gap-1 group">
                                    <span>Price</span>
                                    {renderSortIcon("currentPrice")}
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-[10px] font-black uppercase text-muted-foreground text-right cursor-pointer hover:text-foreground select-none"
                                onClick={() => handleSort("dividendYield")}
                            >
                                <div className="flex items-center justify-end gap-1 group">
                                    <span>Yield</span>
                                    {renderSortIcon("dividendYield")}
                                </div>
                            </TableHead>
                            <TableHead className="w-10 px-2 text-[10px] font-black uppercase text-muted-foreground text-center">
                                Del
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredAssets.length > 0 ? (
                                filteredAssets.map((asset) => (
                                    <WatchlistRow
                                        key={asset.id}
                                        asset={asset}
                                        isSelected={props.selectedSymbols.includes(asset.symbol)}
                                        isPending={isPending}
                                        onSelect={toggleOne}
                                        onDelete={requestDeleteOne}
                                    />
                                ))
                            ) : (
                                <WatchlistEmpty
                                    hasSearch={Boolean(searchQuery || typeFilter !== "all")}
                                    searchQuery={searchQuery}
                                    onResetSearch={() => {
                                        setSearchQuery("");
                                        setTypeFilter("all");
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmText={confirmDialog.confirmText}
                loading={isPending}
                onConfirm={confirmDialog.action}
            />
        </div>
    );
}

export default WatchlistComponent;
