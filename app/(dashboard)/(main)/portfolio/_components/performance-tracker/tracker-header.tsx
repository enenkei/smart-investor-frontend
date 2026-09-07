"use client";

import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackerHeaderProps {
    portfolioName: string;
    benchmark?: string;
    timeframe: string;
    isCalculating: boolean;
    hasResult: boolean;
    onRecalculate: () => void;
}

export const TrackerHeader = ({
    portfolioName,
    benchmark,
    timeframe,
    isCalculating,
    hasResult,
    onRecalculate,
}: TrackerHeaderProps) => {
    return (
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center flex-none">
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                            Portfolio Intelligence Hub
                        </span>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-foreground mt-0.5">
                            {portfolioName || "My Portfolio"}
                        </DialogTitle>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {hasResult && benchmark && (
                        <Badge className="rounded-none bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-2.5 py-1">
                            VS {benchmark} ({timeframe.toUpperCase()})
                        </Badge>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRecalculate}
                        disabled={isCalculating}
                        className="h-8 rounded-none border-border/60 text-xs font-black uppercase tracking-wider gap-1.5 hover:bg-primary/10 hover:text-primary"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isCalculating && "animate-spin text-primary")} />
                        <span>{isCalculating ? "Calculating..." : "Recalculate"}</span>
                    </Button>
                </div>
            </div>
        </DialogHeader>
    );
};
