"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PerformanceResult } from "./types";

interface TabAttributionProps {
    result: PerformanceResult;
    timeframe: string;
}

export const TabAttribution = ({ result, timeframe }: TabAttributionProps) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Asset Holdings & Return Contribution ({timeframe.toUpperCase()})
                </span>
            </div>

            <div className="border border-border/50 overflow-hidden bg-card/20">
                <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Symbol</span>
                    <span className="text-right">Shares</span>
                    <span className="text-right">Live Price</span>
                    <span className="text-right">Position Value</span>
                    <span className="text-right">Weight</span>
                    <span className="text-right">Contribution</span>
                </div>

                <div className="divide-y divide-border/25 max-h-72 overflow-y-auto custom-scrollbar">
                    {result.asset_attribution && result.asset_attribution.length > 0 ? (
                        result.asset_attribution.map((item) => (
                            <div key={item.symbol} className="grid grid-cols-6 gap-2 px-4 py-3 items-center hover:bg-muted/10 transition-colors font-mono text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-sm italic text-primary">{item.symbol}</span>
                                </div>
                                <span className="text-right text-muted-foreground">
                                    {item.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-right text-foreground font-bold">
                                    ${item.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-right text-foreground font-bold">
                                    ${item.current_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-right text-muted-foreground">
                                    {(item.weight * 100).toFixed(1)}%
                                </span>
                                <div className="text-right">
                                    <span className={cn("font-bold", item.contribution >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                        {item.contribution >= 0 ? "+" : ""}{(item.contribution * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        Object.entries(result.current_prices || {}).map(([symbol, price]) => (
                            <div key={symbol} className="grid grid-cols-3 gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors font-mono text-xs">
                                <span className="font-black text-sm italic text-primary">{symbol}</span>
                                <span className="text-right text-muted-foreground">—</span>
                                <span className="text-right font-bold text-foreground">
                                    ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
