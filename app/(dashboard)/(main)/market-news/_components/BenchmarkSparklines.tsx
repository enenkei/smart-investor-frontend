'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Benchmark {
  symbol: string;
  name: string | null;
  data: unknown;
}

interface BenchmarkSparklinesProps {
  benchmarks: Benchmark[];
}

const BenchmarkSparklines: React.FC<BenchmarkSparklinesProps> = ({ benchmarks }) => {
  // Ordered list of symbols as requested
  const order = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
  const sortedBenchmarks = [...benchmarks].sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {sortedBenchmarks.map((index) => {
        // Handle data structure. Assuming 'data' is an object with a key that contains the array
        // or the array itself. Common Alpha Vantage structure for index data in this project:
        // { "Time Series (Daily)": { "YYYY-MM-DD": { "4. close": "..." }, ... } }
        // Let's assume it's pre-processed or at least we can find the values.

        let chartData: { value: number }[] = [];
        let currentPrice = 0;
        let percentChange = 0;

        try {
          // Attempt to parse/normalize data
          const rawData = typeof index.data === 'string' ? JSON.parse(index.data) : index.data;

          if (Array.isArray(rawData)) {
            const sortedRaw = [...rawData].sort((a: any, b: any) => {
              const dateA = new Date(a.date || a.timestamp || a.time || 0).getTime();
              const dateB = new Date(b.date || b.timestamp || b.time || 0).getTime();
              return dateA - dateB;
            });
            chartData = sortedRaw
              .map((d: { price?: number; close?: number; value?: number }) => ({
                value: parseFloat(String(d.price || d.close || d.value))
              }))
              .filter(d => !isNaN(d.value))
              .slice(-30);
          } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const dataObj = rawData as Record<string, any>;
            const keys = Object.keys(dataObj).sort();
            chartData = keys.map(k => {
              const entry = dataObj[k];
              const val = typeof entry === 'object' ? (entry.price || entry.close || entry['4. close']) : entry;
              return { value: parseFloat(String(val)) };
            }).filter(d => !isNaN(d.value)).slice(-30);
          }

          if (chartData.length >= 2) {
            currentPrice = chartData[chartData.length - 1].value;
            const startPrice = chartData[0].value;
            percentChange = startPrice !== 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
          }
        } catch (e) {
          console.error(`Error parsing data for ${index.symbol}:`, e);
        }

        const isPositive = percentChange >= 0;
        const color = isPositive ? '#10b981' : '#f43f5e';

        return (
          <div
            key={index.symbol}
            className="group relative bg-card backdrop-blur-md border border-border rounded-none p-5 flex flex-col transition-all duration-300 hover:border-border/80 hover:shadow-lg overflow-hidden"
          >
            {/* Symbol Background Label */}
            <div className="absolute -right-2 -top-2 text-6xl font-black text-foreground/5 pointer-events-none select-none transition-all duration-500 group-hover:text-foreground/10 group-hover:scale-110">
              {index.symbol.replace('^', '')}
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{index.name || index.symbol}</h4>
                <div className="text-2xl font-black text-foreground tracking-tighter tabular-nums">
                  {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tabular-nums ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(percentChange).toFixed(2)}%
              </div>
            </div>

            <div className="h-16 w-full mt-2 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis hide domain={['auto', 'auto']} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    animationDuration={2000}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex items-center justify-between relative z-10">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">30D PERFORMANCE</span>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPositive ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BenchmarkSparklines;
