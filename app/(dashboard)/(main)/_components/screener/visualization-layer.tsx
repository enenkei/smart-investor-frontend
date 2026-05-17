"use client";

import * as React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VisualizationLayerProps {
  data: any[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border p-3 rounded shadow-xl text-xs">
        <div className="font-bold text-primary mb-1">{data.symbol}</div>
        <div className="text-muted-foreground">{data.etf_name}</div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="font-medium">Yield:</span>
          <span className="text-right font-mono">
            {data.annual_dividend_yield_pct != null ? `${Number(data.annual_dividend_yield_pct).toFixed(2)}%` : "N/A"}
          </span>
          <span className="font-medium">Expense:</span>
          <span className="text-right font-mono">
            {data.expense_ratio != null ? `${(Number(data.expense_ratio) * 100).toFixed(2)}%` : "N/A"}
          </span>
          <span className="font-medium">RSI:</span>
          <span className={cn(
            "text-right font-mono",
            data.rsi < 35 ? "text-emerald-500 font-bold" : data.rsi > 65 ? "text-rose-500 font-bold" : ""
          )}>
            {data.rsi != null ? Number(data.rsi).toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function VisualizationLayer({ data, onSelectSymbol, selectedSymbol }: VisualizationLayerProps) {
  const chartData = React.useMemo(() => {
    return data.map(item => ({
        ...item,
        expense_ratio_pct: item.expense_ratio * 100
    }));
  }, [data]);

  const getRSIColor = (rsi: number) => {
    if (rsi < 35) return "#10b981"; // Emerald
    if (rsi > 65) return "#f43f5e"; // Rose
    return "#71717a"; // Zinc
  };

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Yield vs. Expense Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="expense_ratio_pct" 
              name="Expense" 
              unit="%" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Expense Ratio (%)', position: 'bottom', fontSize: 10, fill: '#71717a', offset: 0 }}
            />
            <YAxis 
              type="number" 
              dataKey="annual_dividend_yield_pct" 
              name="Yield" 
              unit="%" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Dividend Yield (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717a' }}
            />
            <ZAxis type="number" range={[100, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter 
              name="ETFs" 
              data={chartData} 
              onClick={(e) => onSelectSymbol(e.payload.symbol)}
              cursor="pointer"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const isSelected = selectedSymbol === payload.symbol;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 8 : 6}
                    fill={getRSIColor(payload.rsi)}
                    fillOpacity={isSelected ? 1 : 0.6}
                    stroke={isSelected ? "#ffffff" : "transparent"}
                    strokeWidth={2}
                    className="transition-all duration-300 hover:fill-opacity-100"
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
