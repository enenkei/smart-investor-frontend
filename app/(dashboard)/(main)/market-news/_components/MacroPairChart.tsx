'use client';

import React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface MacroPairChartProps {
    title: string;
    pair: [any, any]; // The two data items to plot
    colors?: [string, string];
}

const MacroPairChart: React.FC<MacroPairChartProps> = ({ title, pair, colors = ["#3b82f6", "#10b981"] }) => {
    const item1 = pair[0];
    const item2 = pair[1];

    if (!item1 || !item2) {
        // Fallback for incomplete pairs
        const singleItem = item1 || item2;
        if (!singleItem) return null;
    }

    // Process data for both
    const processData = (data: any) => {
        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        if (!Array.isArray(raw)) return [];
        return raw.map(d => ({
            date: d.date || d.timestamp,
            value: parseFloat(String(d.value || d.price || d.close))
        }))
        .filter(d => !isNaN(d.value))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const allData1 = item1 ? processData(item1.data) : [];
    const allData2 = item2 ? processData(item2.data) : [];

    // Merge by date
    const dateMap = new Map();
    allData1.forEach(d => dateMap.set(d.date, { date: d.date, val1: d.value }));
    allData2.forEach(d => {
        const existing = dateMap.get(d.date);
        if (existing) {
            existing.val2 = d.value;
        } else {
            dateMap.set(d.date, { date: d.date, val2: d.value });
        }
    });

    const chartData = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-60);


    const chartConfig: ChartConfig = {
        val1: {
            label: item1?.name || item1?.indicator || item1?.commodity || 'N/A',
            color: colors[0],
        },
        val2: {
            label: item2?.name || item2?.indicator || item2?.commodity || 'N/A',
            color: colors[1],
        },
    };

    return (
        <div className="flex flex-col gap-3 p-5 bg-card border border-border group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</h4>
                <div className="h-px flex-1 bg-border/20 ml-4" />
            </div>
            
            <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
                <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                        left: 0,
                        right: 0,
                        top: 10,
                        bottom: 0
                    }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={40}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                        }}
                        className="text-[10px] text-muted-foreground"
                    />
                    <YAxis hide domain={['auto', 'auto']} />

                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} className="justify-start gap-4 mt-2" />
                    {item1 && (
                        <Line
                            dataKey="val1"
                            type="monotone"
                            stroke="var(--color-val1)"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                    )}
                    {item2 && (
                        <Line
                            dataKey="val2"
                            type="monotone"
                            stroke="var(--color-val2)"
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                        />
                    )}
                </LineChart>
            </ChartContainer>
        </div>
    );
};

export default MacroPairChart;
