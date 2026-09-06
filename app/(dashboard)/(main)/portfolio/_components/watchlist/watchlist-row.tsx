import React, { memo } from "react";
import { motion } from "framer-motion";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EnrichedWatchlistItem } from "./types";

interface WatchlistRowProps {
    asset: EnrichedWatchlistItem;
    isSelected: boolean;
    isPending: boolean;
    onSelect: (symbol: string, checked: boolean) => void;
    onDelete: (symbol: string) => void;
}

export const WatchlistRow = memo(function WatchlistRow({
    asset,
    isSelected,
    isPending,
    onSelect,
    onDelete,
}: WatchlistRowProps) {
    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
            className="border-b border-border/40 hover:bg-primary/5 transition-colors group cursor-pointer"
            onClick={() => onSelect(asset.symbol, !isSelected)}
        >
            <TableCell className="w-10 px-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(asset.symbol, !!checked)}
                    aria-label={`Select ${asset.symbol}`}
                />
            </TableCell>
            <TableCell className="py-2.5">
                <div className="flex flex-col">
                    <span className="font-black text-base text-foreground/90 tracking-tight italic">
                        {asset.symbol}
                    </span>
                    <span
                        className={`text-[9px] font-black w-fit px-1.5 py-0.2 leading-tight border ${
                            asset.type === "ETF"
                                ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                    >
                        {asset.type}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                {asset.sector || "—"}
            </TableCell>
            <TableCell className="text-sm font-mono font-bold text-right text-foreground/90">
                {asset.currentPrice != null ? `$${asset.currentPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="text-sm font-mono font-bold text-right text-emerald-400">
                {asset.dividendYield != null ? `${(asset.dividendYield * 100).toFixed(2)}%` : "—"}
            </TableCell>
            <TableCell className="w-10 px-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(asset.symbol)}
                        disabled={isPending}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-none"
                        aria-label={`Remove ${asset.symbol}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </TableCell>
        </motion.tr>
    );
});
