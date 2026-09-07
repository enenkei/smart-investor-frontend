"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedDrawerProps {
    show: boolean;
    riskFreeRate: string;
    onRiskFreeRateChange: (rate: string) => void;
    onUpdateRatios: () => void;
}

export const AdvancedDrawer = ({
    show,
    riskFreeRate,
    onRiskFreeRateChange,
    onUpdateRatios,
}: AdvancedDrawerProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 py-3 bg-muted/20 border-b border-border/40 overflow-hidden"
                >
                    <div className="flex items-center gap-6 text-xs max-w-xl">
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    Risk-Free Rate (Annual Treasury):
                                </Label>
                                <span className="font-mono font-bold text-primary">{riskFreeRate}%</span>
                            </div>
                            <Slider
                                value={[parseFloat(riskFreeRate) || 4.5]}
                                min={0.0}
                                max={10.0}
                                step={0.25}
                                onValueChange={([v]) => onRiskFreeRateChange(v.toFixed(2))}
                            />
                            <span className="text-[9px] text-muted-foreground block">
                                Used for CAPM Alpha & Sharpe/Sortino ratios calculation (US 10-Yr Yield default ~4.5%).
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={onUpdateRatios}
                            className="rounded-none h-7 px-3 text-[10px] font-black uppercase"
                        >
                            Update Ratios
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
