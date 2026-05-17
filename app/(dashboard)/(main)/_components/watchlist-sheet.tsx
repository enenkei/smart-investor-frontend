"use client";
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getWatchlist, removeFromWatchlist } from "@/controllers/stock-data-controller";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface WatchlistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WatchlistSheet({ open, onOpenChange }: WatchlistSheetProps) {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    setLoading(true);
    const data = await getWatchlist();
    setWatchlist(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchWatchlist();
    }
  }, [open]);

  // Listen for custom "watchlist-updated" event
  useEffect(() => {
    const handleUpdate = () => {
      fetchWatchlist();
    };
    window.addEventListener("watchlist-updated", handleUpdate);
    return () => window.removeEventListener("watchlist-updated", handleUpdate);
  }, []);

  const handleRemove = async (symbol: string) => {
    const res = await removeFromWatchlist(symbol);
    if (res.success) {
      toast.success(`${symbol} removed from watchlist`);
      fetchWatchlist();
    } else {
      toast.error(`Failed to remove ${symbol}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[200px] sm:w-[250px] p-0 bg-background/95 backdrop-blur-md border-l border-primary/20">
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Watchlist
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {loading ? (
            <div className="flex flex-col gap-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted/20 animate-pulse rounded" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <span className="text-[10px] font-bold uppercase">Empty</span>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              <AnimatePresence mode="popLayout">
                {watchlist.map((item) => (
                  <motion.div
                    key={item.symbol}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black tracking-tight">{item.symbol}</span>
                      <span className="text-[8px] text-muted-foreground uppercase">{item.status}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => handleRemove(item.symbol)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
