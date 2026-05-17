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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Sp500VisualizationProps {
  data: any[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover/90 backdrop-blur-md border border-border p-3 rounded shadow-xl text-xs">
        <div className="font-bold text-primary mb-1">{data.ticker}</div>
        <div className="text-muted-foreground mb-2">{data.name}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="font-medium text-muted-foreground uppercase text-[8px]">Quality Score:</span>
          <span className="text-right font-mono font-bold text-emerald-500">{Number(data.quality_score).toFixed(0)}</span>
          <span className="font-medium text-muted-foreground uppercase text-[8px]">P/E Ratio:</span>
          <span className="text-right font-mono font-bold text-primary">{Number(data.pe_ratio).toFixed(1)}</span>
          <span className="font-medium text-muted-foreground uppercase text-[8px]">RSI:</span>
          <span className="text-right font-mono">{Number(data.rsi).toFixed(1)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function Sp500Visualization({ data, onSelectSymbol, selectedSymbol }: Sp500VisualizationProps) {
  // Transform data to ensure scores are on 0-100 scale for chart display
  const chartData = React.useMemo(() => {
    return data.map(item => {
      const rawQuality = Number(item.quality_score) || 0;
      const quality = rawQuality <= 1 ? rawQuality * 100 : rawQuality;
      return {
        ...item,
        quality_score: quality
      };
    });
  }, [data]);

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          Quality Score vs. P/E Ratio Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="pe_ratio" 
              name="P/E Ratio" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'P/E Ratio', position: 'bottom', fontSize: 10, fill: '#71717a', offset: 0, fontWeight: 'bold' }}
            />
            <YAxis 
              type="number" 
              dataKey="quality_score" 
              name="Quality Score" 
              domain={[0, 100]}
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717a', offset: 10, fontWeight: 'bold' }}
            />
            <ZAxis type="number" range={[100, 600]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#3f3f46' }} />
            <Scatter 
              name="Stocks" 
              data={chartData} 
              onClick={(e) => onSelectSymbol(e.payload.ticker)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedSymbol === entry.ticker;
                const isHighQualityLowRsi = (Number(entry.quality_score) || 0) > 80 && (Number(entry.rsi) || 0) < 35;
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isHighQualityLowRsi ? "#10b981" : "#3b82f6"}
                    fillOpacity={isSelected ? 1 : 0.6}
                    stroke={isSelected ? "#ffffff" : isHighQualityLowRsi ? "#10b981" : "transparent"}
                    strokeWidth={isSelected ? 3 : 1}
                    className="transition-all duration-500"
                    r={isSelected ? 10 : 7}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
