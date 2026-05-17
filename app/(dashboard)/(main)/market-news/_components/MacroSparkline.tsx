'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

interface MacroSparklineProps {
    title: string;
    topic: string; // The topic key to match for highlighting (e.g., 'Inflation')
    data: any;
    unit?: string;
    color?: string;
    className?: string;
}

const MacroSparkline: React.FC<MacroSparklineProps> = ({ title, topic, data, unit, color = '#10b981', className }) => {
    const hoveredTopic = useUIStore(state => state.hoveredTopic);
    const isHighlighted = hoveredTopic?.toLowerCase() === topic.toLowerCase();

    // Data normalization
    let chartData: { value: number }[] = [];
    let currentVal = 'N/A';

    try {
        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(raw)) {
            // Sort by date ascending to ensure Oldest -> Newest
            const sortedRaw = [...raw].sort((a, b) => {
                const dateA = new Date(a.date || a.timestamp || 0).getTime();
                const dateB = new Date(b.date || b.timestamp || 0).getTime();
                return dateA - dateB;
            });

            chartData = sortedRaw
                .map(d => {
                    const val = d.value || d.price || d.close;
                    return { value: parseFloat(String(val)) };
                })
                .filter(d => !isNaN(d.value))
                .slice(-20);

            if (chartData.length > 0) {
                currentVal = chartData[chartData.length - 1].value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
        }
    } catch (e) {
        console.error(`Error parsing macro data for ${title}:`, e);
    }

    const values = chartData.map(d => d.value);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const mid = (min + max) / 2;

    return (
        <div className={cn(
            "group flex flex-col gap-2 p-4 bg-card border border-border transition-all duration-500",
            isHighlighted ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02] bg-emerald-50/30" : "hover:border-border/80",
            className
        )}>
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</span>
                    <div className="text-xl font-black text-foreground tabular-nums tracking-tighter">
                        {currentVal}{unit}
                    </div>
                </div>
                {isHighlighted && (
                    <div className="text-[8px] font-black text-emerald-600 animate-pulse uppercase tracking-widest">
                        Topic Match
                    </div>
                )}
            </div>

            <div className="h-16 w-full opacity-60 group-hover:opacity-100 transition-opacity mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${topic}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <YAxis
                            domain={['auto', 'auto']}
                            ticks={[min, mid, max]}
                            tick={{ fontSize: 8, fontWeight: 900, fill: 'currentColor' }}
                            tickFormatter={(val) => val.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            axisLine={false}
                            tickLine={false}
                            className="text-muted-foreground/40"
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-background border border-border px-2 py-1 text-[10px] font-black tabular-nums shadow-sm">
                                            {Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            fillOpacity={1}
                            fill={`url(#gradient-${topic})`}
                            strokeWidth={2}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MacroSparkline;
