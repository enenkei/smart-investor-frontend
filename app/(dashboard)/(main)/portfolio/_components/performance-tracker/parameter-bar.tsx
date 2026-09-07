"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sliders, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BENCHMARK_OPTIONS, TIMEFRAME_OPTIONS } from "./types";

interface ParameterBarProps {
    benchmark: string;
    customBenchmark: string;
    timeframe: string;
    showAdvanced: boolean;
    onSelectBenchmark: (b: string) => void;
    onCustomBenchmarkChange: (val: string) => void;
    onCustomBenchmarkApply: () => void;
    onSelectTimeframe: (tf: string) => void;
    onToggleAdvanced: () => void;
}

export const ParameterBar = ({
    benchmark,
    customBenchmark,
    timeframe,
    showAdvanced,
    onSelectBenchmark,
    onCustomBenchmarkChange,
    onCustomBenchmarkApply,
    onSelectTimeframe,
    onToggleAdvanced,
}: ParameterBarProps) => {
    return (
        <div className="px-6 py-3 border-b border-border/40 bg-background/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Benchmark Selection Chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-none">
                    Benchmark:
                </span>
                <div className="flex flex-wrap gap-1">
                    {BENCHMARK_OPTIONS.map((b) => (
                        <button
                            key={b.value}
                            onClick={() => onSelectBenchmark(b.value)}
                            className={cn(
                                "px-2.5 py-1 text-[11px] font-mono font-bold transition-all border",
                                benchmark === b.value && !customBenchmark
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-muted/20 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/40"
                            )}
                            title={b.desc}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
                {/* Custom Symbol Input */}
                <div className="flex items-center gap-1 ml-1">
                    <Input
                        value={customBenchmark}
                        onChange={(e) => onCustomBenchmarkChange(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && customBenchmark.trim()) {
                                onCustomBenchmarkApply();
                            }
                        }}
                        placeholder="Custom (e.g. VOO)"
                        className="h-7 w-28 text-[11px] font-mono font-bold uppercase rounded-none bg-background/60 border-border/60"
                    />
                    {customBenchmark.trim() && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onCustomBenchmarkApply}
                            className="h-7 px-2 text-[10px] font-black uppercase rounded-none"
                        >
                            Apply
                        </Button>
                    )}
                </div>
            </div>

            {/* Timeframe Selection Pills */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex-none">
                    Period:
                </span>
                <div className="flex border border-border/60 bg-muted/20 p-0.5">
                    {TIMEFRAME_OPTIONS.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => onSelectTimeframe(tf.value)}
                            className={cn(
                                "px-2.5 py-0.5 text-[11px] font-mono font-bold transition-all",
                                timeframe === tf.value
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>

                {/* Advanced Controls Toggle */}
                <button
                    onClick={onToggleAdvanced}
                    className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors ml-1 uppercase tracking-wider"
                >
                    <Sliders className="w-3 h-3" />
                    <span>{showAdvanced ? "Hide RFR" : "Advanced"}</span>
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
};
