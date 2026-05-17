'use client';

import React, { useEffect, useState } from 'react';
import { getMacroData } from '@/controllers/stock-data-controller';
import MacroPairChart from './MacroPairChart';
import { LineChart } from 'lucide-react';

const MacroLinkSidebar = () => {
    const [macroData, setMacroData] = useState<any>({ indicators: [], commodities: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [macro] = await Promise.all([
                getMacroData()
            ]);
            setMacroData(macro);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-8">
                <div className="animate-pulse flex flex-col gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted/20 border border-border" />
                    ))}
                </div>
            </div>
        );
    }

    const findItem = (list: any[], key: string) => {
        if (!list) return null;
        const normalizedKey = key.toLowerCase();
        return list.find(i => 
            (i.indicator || '').toLowerCase() === normalizedKey ||
            (i.commodity || '').toLowerCase() === normalizedKey ||
            (i.indicator || i.commodity || i.name || '').toLowerCase().includes(normalizedKey)
        );
    };

    const macroPairs = [
        {
            title: "Interest Rates",
            pair: [
                findItem(macroData.indicators, 'FEDERAL_FUNDS_RATE'),
                findItem(macroData.indicators, 'TREASURY_YIELD')
            ] as [any, any],
            colors: ["#3b82f6", "#10b981"]
        },
        {
            title: "Inflation Monitor",
            pair: [
                findItem(macroData.indicators, 'CPI'),
                findItem(macroData.indicators, 'INFLATION')
            ] as [any, any],
            colors: ["#3b82f6", "#8b5cf6"]
        },
        {
            title: "Energy Mix",
            pair: [
                findItem(macroData.commodities, 'BRENT') || findItem(macroData.commodities, 'oil'),
                findItem(macroData.commodities, 'NATURAL_GAS')
            ] as [any, any],
            colors: ["#f59e0b", "#ea580c"]
        },
        {
            title: "Agri Products",
            pair: [
                findItem(macroData.commodities, 'CORN'),
                findItem(macroData.commodities, 'WHEAT')
            ] as [any, any],
            colors: ["#f59e0b", "#84cc16"]
        },
        {
            title: "Metals",
            pair: [
                findItem(macroData.commodities, 'GOLD_SILVER_HISTORY') || findItem(macroData.commodities, 'gold'),
                findItem(macroData.commodities, 'COPPER')
            ] as [any, any],
            colors: ["#f59e0b", "#94a3b8"]
        },
        {
            title: "Growth vs Inflation",
            pair: [
                findItem(macroData.indicators, 'REAL_GDP_PER_CAPITA'),
                findItem(macroData.indicators, 'INFLATION')
            ] as [any, any],
            colors: ["#3b82f6", "#ef4444"]
        }
    ];


    return (
        <div className="flex flex-col gap-10">
            {/* Macro Sparklines Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <LineChart size={16} className="text-emerald-500" />
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">The Macro Link</h3>
                </div>

                <div className="flex flex-col gap-4">
                    {macroPairs.map((group, idx) => (
                        <MacroPairChart 
                            key={idx}
                            title={group.title}
                            pair={group.pair}
                            colors={group.colors as [string, string]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MacroLinkSidebar;
