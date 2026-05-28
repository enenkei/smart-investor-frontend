"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

// This type is used to define the shape of our data.
export type Asset = {
    symbol: string,
    shares: number | null,
    avg_cost_basis: number | null,
    weight: number | null,
    owner_id: number,
    portfolio_id: number,
    owner_name: string | null,
    updated_at: Date,
    current_price?: number | null,
    prev_close?: number | null,
    one_day_change?: number | null,
    price_history?: any[] | null
}

const Sparkline = ({ data }: { data: any }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div className="text-muted-foreground/30 text-xs font-mono font-medium">-</div>;
    }
    
    // Sort by date chronologically
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const prices = sortedData.map(d => Number(d.price)).filter(p => !isNaN(p));
    
    if (prices.length < 2) {
        return <div className="text-muted-foreground/30 text-xs font-mono font-medium">-</div>;
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;
    
    const width = 90;
    const height = 24;
    const padding = 2;
    
    const points = prices.map((price, index) => {
        const x = (index / (prices.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((price - min) / range) * (height - 2 * padding) - padding;
        return { x, y };
    });
    
    const pathD = points.reduce((acc, p, index) => {
        return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
    
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    
    const isPositive = prices[prices.length - 1] >= prices[0];
    const strokeColor = isPositive ? "#34d399" : "#f87171"; // Emerald-400 or Rose-400
    const fillId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg width={width} height={height} className="overflow-visible inline-block">
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0"/>
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${fillId})`} />
            <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export const columns: ColumnDef<Asset>[] = [
    {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => {
            return <span className="font-bold text-foreground font-mono">{row.getValue("symbol")}</span>
        }
    },
    {
        accessorKey: "shares",
        header: "Shares",
        cell: ({ row }) => {
            const val = row.getValue("shares") as number | null
            if (val === null) return <span className="font-mono text-muted-foreground/50">-</span>
            return <span className="font-mono font-medium">{val}</span>
        }
    },
    {
        accessorKey: "avg_cost_basis",
        header: () => <div className="text-right">Avg Cost Basis</div>,
        cell: ({ row }) => {
            const val = row.getValue("avg_cost_basis") as number | null
            if (val === null) return <div className="text-right font-mono text-muted-foreground/50">-</div>
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(val)

            return <div className="text-right font-mono font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "current_price",
        header: () => <div className="text-right">Price (Current/Prev)</div>,
        cell: ({ row }) => {
            const current = row.original.current_price;
            const prev = row.original.prev_close;
            if (current === undefined || current === null) {
                return <div className="text-right font-mono text-muted-foreground/50">-</div>;
            }
            
            const formatCurrency = (val: number) => {
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(val);
            };

            return (
                <div className="text-right flex flex-col justify-center leading-tight">
                    <span className="font-bold font-mono text-xs text-foreground">{formatCurrency(Number(current))}</span>
                    {prev !== null && prev !== undefined && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            prev: {formatCurrency(Number(prev))}
                        </span>
                    )}
                </div>
            );
        }
    },
    {
        accessorKey: "one_day_change",
        header: () => <div className="text-right">24h Change</div>,
        cell: ({ row }) => {
            const change = row.original.one_day_change;
            if (change === undefined || change === null) {
                return <div className="text-right font-mono text-muted-foreground/50">-</div>;
            }
            
            const changeVal = Number(change);
            const isPositive = changeVal >= 0;
            
            return (
                <div className={`text-right flex items-center justify-end font-mono font-black text-xs gap-0.5 ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                }`}>
                    {isPositive ? (
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                    <span>{isPositive ? "+" : ""}{changeVal.toFixed(2)}%</span>
                </div>
            );
        }
    },
    {
        accessorKey: "price_history",
        header: () => <div className="text-center">Trend (2Y)</div>,
        cell: ({ row }) => {
            const history = row.original.price_history;
            return (
                <div className="flex items-center justify-center">
                    <Sparkline data={history} />
                </div>
            );
        }
    },
    {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => {
            const val = row.getValue("weight") as number | null
            if (val === null) return <span className="font-mono text-muted-foreground/50">-</span>;
            return <span className="font-mono font-bold text-primary text-right">{(val * 100).toFixed(2)}%</span>
        }
    },
    {
        accessorKey: "updated_at",
        header: "Optimized Date",
        cell: ({ row }) => {
            const val = row.getValue("updated_at") as Date | null
            if (val === null) return <span className="font-mono text-muted-foreground/50">-</span>;
            return <span className="font-mono text-xs text-muted-foreground">{format(new Date(val), "yyyy/MM/dd")}</span>
        }
    },
]