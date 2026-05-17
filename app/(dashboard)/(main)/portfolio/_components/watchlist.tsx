import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Eraser } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { watchlist } from "@/generated/prisma/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";


interface EnrichedWatchlistItem {
    id: number;
    symbol: string;
    sector: string | null;
    currentPrice: number | null;
    dividendYield: number | null;
    type: 'Stock' | 'ETF';
}

const AssetRow = ({
    asset,
    onDelete,
    isPending,
    isSelected,
    onSelect
}: {
    asset: EnrichedWatchlistItem,
    onDelete: (s: string) => void,
    isPending: boolean,
    isSelected: boolean,
    onSelect: (symbol: string, checked: boolean) => void
}) => {

    return (
        <motion.tr
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="border-border/50 hover:bg-primary/5 transition-colors group"
        >
            <TableCell className="w-10 px-2">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(asset.symbol, !!checked)}
                    aria-label={`Select ${asset.symbol}`}
                />
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-black text-lg text-secondary italic tracking-tight">{asset.symbol}</span>
                    <span className={`text-[9px] font-black w-fit px-1 leading-tight border ${asset.type === 'ETF'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                    >
                        {asset.type}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">
                {asset.sector || "—"}
            </TableCell>
            <TableCell className="text-sm font-mono font-bold text-right">
                {asset.currentPrice ? `$${asset.currentPrice.toFixed(2)}` : "—"}
            </TableCell>
            <TableCell className="text-sm font-mono font-bold text-right text-emerald-500">
                {asset.dividendYield ? `${(asset.dividendYield * 100).toFixed(2)}%` : "—"}
            </TableCell>
            <TableCell>
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(asset.symbol)}
                        disabled={isPending}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-none"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </motion.tr>
    );
};


type Props = {
    watchlist: EnrichedWatchlistItem[],
    searchQuery: string,
    handleDelete: (symbol: string) => void,
    handleDeleteSelected: () => void,
    handleClearAll: () => void,
    isPending: boolean,
    selectedSymbols: string[],
    onSelectionChange: (symbols: string[]) => void
}


const Watchlist = ({
    watchlist,
    searchQuery,
    handleDelete,
    handleDeleteSelected,
    handleClearAll,
    isPending,
    selectedSymbols,
    onSelectionChange
}: Props) => {
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
    const filteredAssets = watchlist.filter(w => w.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

    const toggleAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(filteredAssets.map(w => w.symbol));
        } else {
            onSelectionChange([]);
        }
    };

    const toggleOne = (symbol: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedSymbols, symbol]);
        } else {
            onSelectionChange(selectedSymbols.filter(s => s !== symbol));
        }
    };

    const isAllSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedSymbols.includes(a.symbol));

    return (
        <>
            <div className="flex items-center justify-between px-2 py-2 border-b border-border/50 bg-muted/10">
                <div className="flex items-center gap-2">
                    {selectedSymbols.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={isPending}
                            className="h-7 rounded-none font-black text-[9px] uppercase tracking-widest gap-1.5"
                        >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Remove Selected ({selectedSymbols.length})
                        </Button>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClearAllDialogOpen(true)}
                    disabled={isPending || watchlist.length === 0}
                    className="h-7 rounded-none font-bold text-[9px] uppercase tracking-widest gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                >
                    <Eraser className="w-3 h-3" />
                    Clear All
                </Button>
            </div>
            <Table>
                <TableHeader className="bg-muted/20">
                    <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="w-10 px-2">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={(checked) => toggleAll(!!checked)}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Ticker</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Sector</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">Price</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">Yield</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <AnimatePresence mode="popLayout">
                        {filteredAssets.length > 0 ? (
                            filteredAssets.map((w) => (
                                <AssetRow
                                    key={w.id}
                                    asset={w}
                                    onDelete={handleDelete}
                                    isPending={isPending}
                                    isSelected={selectedSymbols.includes(w.symbol)}
                                    onSelect={toggleOne}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                    {searchQuery ? "No assets matching your search." : "No assets added yet. Start by adding a ticker above."}
                                </TableCell>
                            </TableRow>

                        )}
                    </AnimatePresence>
                </TableBody>
            </Table>

            <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
                <DialogContent className="rounded-none border-border/60">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter text-destructive">Clear Watchlist</DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            Are you sure you want to remove <span className="font-bold text-foreground">ALL assets</span> from your watchlist? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setClearAllDialogOpen(false)}
                            className="rounded-none font-bold uppercase text-[10px] tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                handleClearAll();
                                setClearAllDialogOpen(false);
                            }}
                            className="rounded-none font-bold uppercase text-[10px] tracking-widest"
                        >
                            Confirm Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};


export default Watchlist;
