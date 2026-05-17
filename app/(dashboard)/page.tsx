"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EtfScreener from "./(main)/_components/etf-screener";
import StocksScreener from "./(main)/_components/stocks-screener";
import { WatchlistSheet } from "./(main)/_components/watchlist-sheet";
import { Button } from "@/components/ui/button";
import { LayoutList } from "lucide-react";

export default function DashboardPage() {
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  return (
    <div className="flex h-full relative">
      <Tabs defaultValue="etfs" className="w-full flex flex-col h-full">
        <div className="flex items-center px-4 bg-muted/10 border-b border-border/50 shrink-0">
          <TabsList className="bg-transparent border-none p-0 h-12">
            <TabsTrigger
              value="etfs"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none h-full px-6 font-bold uppercase text-[10px] tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              ETFs
            </TabsTrigger>
            <TabsTrigger
              value="sp500"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none h-full px-6 font-bold uppercase text-[10px] tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all"
            >
              NASDAQ & NYSE
            </TabsTrigger>
          </TabsList>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWatchlistOpen(true)}
              className="gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
              <LayoutList className="w-4 h-4" />
              Watchlist
            </Button>
          </div>
        </div>

        <TabsContent value="etfs" className="flex-1 overflow-hidden h-full mt-0">
          <EtfScreener />
        </TabsContent>
        <TabsContent value="sp500" className="flex-1 overflow-hidden h-full mt-0">
          <StocksScreener />
        </TabsContent>
      </Tabs>

      <WatchlistSheet open={watchlistOpen} onOpenChange={setWatchlistOpen} />
    </div>
  );
}
