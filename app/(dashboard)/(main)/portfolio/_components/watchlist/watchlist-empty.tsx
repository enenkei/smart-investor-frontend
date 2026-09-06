import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { SearchX, BookmarkPlus } from "lucide-react";

interface WatchlistEmptyProps {
    hasSearch: boolean;
    searchQuery?: string;
    onResetSearch?: () => void;
}

export function WatchlistEmpty({ hasSearch, searchQuery, onResetSearch }: WatchlistEmptyProps) {
    return (
        <TableRow>
            <TableCell colSpan={6} className="h-44 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    {hasSearch ? (
                        <>
                            <SearchX className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-xs font-semibold">
                                No assets matching &ldquo;{searchQuery}&rdquo;
                            </p>
                            {onResetSearch && (
                                <button
                                    onClick={onResetSearch}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline mt-1"
                                >
                                    Clear search
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <BookmarkPlus className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-xs font-semibold">Watchlist is empty</p>
                            <p className="text-[11px] text-muted-foreground/60 max-w-[200px]">
                                Add tickers using the search bar above to track assets and build portfolios.
                            </p>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}
