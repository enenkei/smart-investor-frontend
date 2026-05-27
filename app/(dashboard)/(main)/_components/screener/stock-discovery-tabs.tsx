"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Award, 
    TrendingUp, 
    DollarSign, 
    Gem, 
    Loader2, 
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";

interface StockDiscoveryTabsProps {
    onSelectSymbol: (symbol: string) => void;
    selectedSymbol: string | null;
}

export function StockDiscoveryTabs({ onSelectSymbol, selectedSymbol }: StockDiscoveryTabsProps) {
    const [loading, setLoading] = React.useState(true);
    const [discoveryData, setDiscoveryData] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState<"best_performers" | "growth" | "dividends" | "hidden_gems">("best_performers");

    React.useEffect(() => {
        const fetchDiscovery = async () => {
            try {
                const res = await fetch("/api/portfolio/stock-screener");
                if (res.ok) {
                    const data = await res.json();
                    setDiscoveryData(data);
                }
            } catch (err) {
                console.error("Failed to fetch Stock Screener discovery data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscovery();
    }, []);

    if (loading) {
        return (
            <Card className="rounded-none border-border/50 bg-card/25 backdrop-blur-md p-8 flex flex-col items-center justify-center min-h-[250px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aggregating S&P 500 Equity Indicators...</span>
            </Card>
        );
    }

    if (!discoveryData) return null;

    const tabsList = [
        { id: "best_performers", label: "Best Performers", icon: Award, color: "text-emerald-400 border-emerald-500/20" },
        { id: "growth", label: "High Growth", icon: TrendingUp, color: "text-violet-400 border-violet-500/20" },
        { id: "dividends", label: "Safe Dividends", icon: DollarSign, color: "text-amber-400 border-amber-500/20" },
        { id: "hidden_gems", label: "Boutique Value Gems", icon: Gem, color: "text-cyan-400 border-cyan-500/20" },
    ] as const;

    const currentList = discoveryData[activeTab] || [];

    return (
        <Card className="rounded-none border-border/50 bg-card/20 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="border-b border-border/50 bg-muted/5 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Unified Stock Discovery Board</span>
                    <CardTitle className="text-lg font-black uppercase tracking-tight italic text-foreground mt-0.5">
                        Strategic Equity Targets
                    </CardTitle>
                </div>
                <div className="flex flex-wrap gap-1 border border-border/50 bg-background/40 p-1">
                    {tabsList.map((t) => {
                        const Icon = t.icon;
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-left text-[11px] font-black uppercase tracking-wider transition-all duration-200 rounded-none ${
                                    isActive 
                                    ? 'bg-primary text-primary-foreground font-black' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/35'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentList.slice(0, 4).map((stock: any, idx: number) => {
                        const isSelected = selectedSymbol === stock.symbol;
                        return (
                            <motion.div
                                key={stock.symbol}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => onSelectSymbol(stock.symbol)}
                                className={`cursor-pointer border p-4 flex flex-col justify-between h-44 transition-all duration-200 ${
                                    isSelected 
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                    : 'border-border/50 bg-card/40 hover:border-border hover:bg-muted/10'
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] text-muted-foreground font-bold">#{idx + 1} PICK</span>
                                        <Badge className="rounded-none font-black tracking-widest text-[8px] uppercase px-1.5 py-0 border border-primary/25 bg-primary/10 text-primary">
                                            {stock.symbol}
                                        </Badge>
                                    </div>
                                    <h4 className="font-black text-sm italic text-foreground tracking-tight line-clamp-2 mt-2">{stock.name}</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                        {stock.sector || "General Sector"}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/30 flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Live Closing</span>
                                        <span className="font-mono text-sm font-black text-foreground">
                                            ${Number(stock.price).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Categorized Metrics badge */}
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                            {activeTab === "best_performers" && "Adaptive Score"}
                                            {activeTab === "growth" && "Growth Score"}
                                            {activeTab === "dividends" && "Div. Yield"}
                                            {activeTab === "hidden_gems" && "Quality Score"}
                                        </span>
                                        <span className={`font-mono text-sm font-black ${
                                            activeTab === "best_performers" && "text-emerald-400"
                                        } ${
                                            activeTab === "growth" && "text-violet-400"
                                        } ${
                                            activeTab === "dividends" && "text-amber-400"
                                        } ${
                                            activeTab === "hidden_gems" && "text-cyan-400"
                                        }`}>
                                            {activeTab === "best_performers" && `${Number(stock.score || stock.total_return).toFixed(1)}`}
                                            {activeTab === "growth" && `${Number(stock.growth_score || stock.total_return).toFixed(1)}`}
                                            {activeTab === "dividends" && `${Number(stock.dividend_yield).toFixed(2)}%`}
                                            {activeTab === "hidden_gems" && `${Number(stock.quality_score || stock.total_return).toFixed(1)}`}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
