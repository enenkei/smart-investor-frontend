"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface TrackerFooterProps {
    portfolioId: number;
    benchmark?: string;
    onClose: () => void;
}

export const TrackerFooter = ({
    portfolioId,
    benchmark,
    onClose,
}: TrackerFooterProps) => {
    return (
        <div className="px-6 py-3.5 border-t border-border/50 bg-muted/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span>Portfolio ID: {portfolioId}</span>
                {benchmark && <span>• Benchmark: {benchmark}</span>}
            </div>
            <Button
                onClick={onClose}
                className="rounded-none bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase text-xs tracking-widest h-8 px-5"
            >
                Close Diagnostics
            </Button>
        </div>
    );
};
