"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBenchmarkData } from "@/controllers/stock-data-controller";

export function StatusBar() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string>("...");

  useEffect(() => {
    const fetchBenchmarks = async () => {
      const data = await getBenchmarkData();
      const formatted = data.map((item: any) => {
        let currentPrice = 0;
        let percentChange = 0;
        try {
          const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          let chartData: { value: number }[] = [];
          if (Array.isArray(rawData)) {
            chartData = rawData.slice(-2).map((d: any) => ({
              value: parseFloat(String(d.price || d.close || d.value || 0))
            }));
          } else if (rawData && typeof rawData === 'object') {
            const dataObj = rawData as Record<string, any>;
            const keys = Object.keys(dataObj).sort();
            chartData = keys.slice(-2).map(k => {
              const entry = dataObj[k];
              const val = typeof entry === 'object' ? (entry.price || entry.close || entry['4. close'] || 0) : entry;
              return { value: parseFloat(String(val || 0)) };
            });
          }
          if (chartData.length >= 2) {
            currentPrice = chartData[chartData.length - 1].value;
            const prevPrice = chartData[chartData.length - 2].value;
            percentChange = prevPrice !== 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
          }
        } catch (e) {
          console.error(`Error parsing data for ${item.symbol}:`, e);
        }

        const symbolMap: Record<string, string> = {
          '^GSPC': 'S&P 500',
          '^DJI': 'Dow 30',
          '^IXIC': 'Nasdaq',
          '^RUT': 'Russell 2K',
          '^VIX': 'VIX'
        };

        return {
          symbol: symbolMap[item.symbol] || item.symbol.replace('^', ''),
          price: currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
          isUp: percentChange >= 0
        };
      });
      setBenchmarks(formatted);

      if (data.length > 0) {
        const latest = new Date(Math.max(...data.map(d => new Date(d.last_updated || 0).getTime())));
        const diffMs = new Date().getTime() - latest.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        setLastSync(diffMins < 1 ? 'Just now' : `${diffMins}m ago`);
      }
    };

    fetchBenchmarks();
    const interval = setInterval(fetchBenchmarks, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-10 border-t border-border bg-background/80 backdrop-blur-md flex items-center px-6 justify-between gap-4 overflow-hidden shrink-0 z-30">
      {/* Ticker Tape */}
      <div className="flex-1 overflow-hidden relative h-full w-[600px] flex items-center">
        {/* Fade Edges */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />

        <div className="animate-marquee gap-12 py-1 flex items-center">
          {/* First set of benchmarks */}
          {benchmarks.map((item, idx) => (
            <div key={`${item.symbol}-1-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.symbol}</span>
              <span className="text-xs font-black tabular-nums tracking-tighter">{item.price}</span>
              <span className={cn(
                "text-[9px] flex items-center gap-0.5 font-black tabular-nums",
                item.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                {item.isUp ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                {item.change}
              </span>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {benchmarks.map((item, idx) => (
            <div key={`${item.symbol}-2-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.symbol}</span>
              <span className="text-xs font-black tabular-nums tracking-tighter">{item.price}</span>
              <span className={cn(
                "text-[9px] flex items-center gap-0.5 font-black tabular-nums",
                item.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                {item.isUp ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0 justify-end ml-4">
        {/* Last Sync */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3 text-primary/50" />
          <span>Last Sync: <span className="font-bold text-foreground uppercase tracking-tight">{lastSync}</span></span>
        </div>
      </div>
    </footer>
  );
}
