"use client";

import React, { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
    Search,
    Plus,
    TrendingUp,
    BarChart2,
    Loader2,
    Zap,
    Activity,
    Scale
} from "lucide-react";
import SuggestRebuildDialog from "./suggest-rebuild-dialog";
import { Badge } from "@/components/ui/badge";

import { deleteAsset, addAsset, searchTickers, TickerSearchResult, PortfolioCandidate, getPortfolioCandidates, deleteMultipleWatchlistItems, clearWatchlist, savePerformanceResultToPortfolio } from "@/lib/actions/assets";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PortfolioOptimizerDialog from "./portfolio-optimizer-dialog";
import { OptimizedPortfolio } from "@/lib/data-types";
import UserPortfolio from "./portfolio/user-portfolio";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import Watchlist from "./watchlist";
import PerformanceTrackerDialog from "./performance-tracker-dialog";

const BuildPortfolio = () => {
    const [newSymbol, setNewSymbol] = useState("");
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");
    const { watchlist, fetchWatchlist, userAssets, userPortfolios, fetchUserPortfolios } = usePortfolioStore();

    // Portfolio optimizer state
    const [dialogOpen, setDialogOpen] = useState(false);

    // Ticker autocomplete state
    const [suggestions, setSuggestions] = useState<TickerSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [confirmedFromSuggestion, setConfirmedFromSuggestion] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [candidates, setCandidates] = useState<PortfolioCandidate[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<OptimizedPortfolio | null>(null);
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [portfolio_id, setPortfolio_id] = useState<number>(0);

    // Performance tracker states
    const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
    const [performanceResult, setPerformanceResult] = useState<any | null>(null);
    const [isTrackingPerformance, setIsTrackingPerformance] = useState(false);

    // Suggest rebuild states
    const [rebuildDialogOpen, setRebuildDialogOpen] = useState(false);
    const [rebuildResult, setRebuildResult] = useState<any | null>(null);
    const [isSuggestingRebuild, setIsSuggestingRebuild] = useState(false);

    // Health score check (disable Rebuild if Score >= 85)
    const currentPortfolio = userPortfolios.find(p => p.id === portfolio_id);
    const currentScore = currentPortfolio?.performance_tracking
        ? (currentPortfolio.performance_tracking as any).health?.score
        : null;
    const isHealthExcellent = currentScore !== null && currentScore >= 85;

    const handleSuggestRebuild = async () => {
        if (!portfolio_id) {
            toast.error("Please select a portfolio to track performance.");
            return;
        }

        setIsSuggestingRebuild(true);
        try {
            const assetsInPortfolio = userAssets.filter(a => a.portfolio_id === portfolio_id);
            if (assetsInPortfolio.length === 0) {
                toast.error("The selected portfolio has no assets.");
                return;
            }

            const tickers = assetsInPortfolio.map(a => a.symbol);
            const shares = assetsInPortfolio.map(a => a.shares ?? 0);

            const candidatesData = await getPortfolioCandidates(tickers);

            const formattedCandidates = candidatesData.map(c => ({
                symbol: c.symbol,
                total_return: c.total_return,
                beta: c.beta,
                asset_type: c.asset_type,
                dividend_yield: c.dividend_yield
            }));

            const res = await fetch("/api/portfolio/suggest-rebuild", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidates: formattedCandidates,
                    shares: shares,
                    target_monthly_income: 100.0,
                    monthly_contribution: 5000.0,
                    reinvest_dividend: true
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            if (data.success) {
                setRebuildResult(data);
                setRebuildDialogOpen(true);
            } else {
                toast.error(data.error || "Suggest rebuild failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to fetch rebalance suggestions");
        } finally {
            setIsSuggestingRebuild(false);
        }
    };

    const handleTrackPerformance = async () => {
        if (!portfolio_id) {
            toast.error("Please select a portfolio to track performance.");
            return;
        }

        // 24h caching check
        const currentPortfolio = userPortfolios.find(p => p.id === portfolio_id);
        if (currentPortfolio && currentPortfolio.performance_tracking && currentPortfolio.updated_at) {
            const updatedAt = new Date(currentPortfolio.updated_at);
            const now = new Date();
            const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

            const trackingObj = currentPortfolio.performance_tracking as any;
            if (diffHours < 24 && trackingObj && trackingObj.success) {
                setPerformanceResult(trackingObj);
                setPerformanceDialogOpen(true);
                toast.success("Displaying fresh cached performance diagnostics.");
                return;
            }
        }

        setIsTrackingPerformance(true);
        try {
            const assetsInPortfolio = userAssets.filter(a => a.portfolio_id === portfolio_id);
            if (assetsInPortfolio.length === 0) {
                toast.error("The selected portfolio has no assets.");
                return;
            }

            const tickers = assetsInPortfolio.map(a => a.symbol);
            const shares = assetsInPortfolio.map(a => a.shares ?? 0);

            const candidatesData = await getPortfolioCandidates(tickers);

            const formattedCandidates = candidatesData.map(c => ({
                symbol: c.symbol,
                total_return: c.total_return,
                beta: c.beta,
                asset_type: c.asset_type,
                dividend_yield: c.dividend_yield
            }));

            const res = await fetch("/api/portfolio/track-performance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidates: formattedCandidates,
                    shares: shares,
                    benchmark: "^GSPC"
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            if (data.success) {
                setPerformanceResult(data);
                setPerformanceDialogOpen(true);

                try {
                    await savePerformanceResultToPortfolio(portfolio_id, data);
                    await fetchUserPortfolios();
                    toast.success("Performance diagnostics successfully saved to database!");
                } catch (dbErr: any) {
                    console.error("Failed to save performance data to database:", dbErr);
                }
            } else {
                toast.error(data.error || "Performance tracking failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to track performance");
        } finally {
            setIsTrackingPerformance(false);
        }
    };


    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!newSymbol || newSymbol.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchTickers(newSymbol);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
                setHighlightedIndex(-1);
            } finally {
                setIsSearching(false);
            }
        }, 250);
    }, [newSymbol]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectSuggestion = useCallback((result: TickerSearchResult) => {
        setNewSymbol(result.symbol);
        setShowSuggestions(false);
        setSuggestions([]);
        setConfirmedFromSuggestion(true);
    }, []);

    const handleAdd = async () => {
        if (!newSymbol) return;
        const symbol = newSymbol.toUpperCase();
        if (watchlist.some(a => a.symbol === symbol)) {
            toast.error("Asset already in list");
            return;
        }

        setShowSuggestions(false);
        startTransition(async () => {
            try {
                await addAsset(symbol);
                await fetchWatchlist();
                setNewSymbol("");
                setConfirmedFromSuggestion(false);
                toast.success(`${symbol} added to watchlist`);
            } catch (error) {
                toast.error("Failed to add asset");
            }
        });
    };

    const handleOpenOptimizer = async () => {
        setDialogOpen(true);
        setOptimizationResult(null);
        setCandidatesLoading(true);
        try {
            const c = await getPortfolioCandidates(selectedTickers);
            setCandidates(c);
        } catch {
            toast.error("Failed to load asset data");
        } finally {
            setCandidatesLoading(false);
        }
    };

    const handleDelete = async (symbol: string) => {
        startTransition(async () => {
            try {
                await deleteAsset(symbol);
                await fetchWatchlist();
                setSelectedTickers(prev => prev.filter(s => s !== symbol));
                toast.success(`${symbol} removed`);
            } catch (error) {
                toast.error("Failed to remove asset");
            }
        });
    };

    const handleClearWatchlist = async () => {
        startTransition(async () => {
            try {
                await clearWatchlist();
                await fetchWatchlist();
                setSelectedTickers([]);
                toast.success("Watchlist cleared");
            } catch (error) {
                toast.error("Failed to clear watchlist");
            }
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedTickers.length === 0) return;
        startTransition(async () => {
            try {
                await deleteMultipleWatchlistItems(selectedTickers);
                await fetchWatchlist();
                setSelectedTickers([]);
                toast.success(`${selectedTickers.length} assets removed`);
            } catch (error) {
                toast.error("Failed to remove selected assets");
            }
        });
    };


    // const filteredAssets = assets.filter(a =>
    //     a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    // );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative z-20 flex flex-col md:flex-row gap-4 items-end justify-between bg-card/20 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Add New Ticker</label>
                    <div className="flex gap-2">
                        <div ref={searchContainerRef} className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin z-10" />
                            )}
                            <Input
                                placeholder="Enter ticker (e.g. AAPL, NVDA)..."
                                className="pl-10 rounded-none bg-background/50 border-border/50 uppercase font-bold"
                                value={newSymbol}
                                onChange={(e) => { setNewSymbol(e.target.value); setConfirmedFromSuggestion(false); }}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                                            selectSuggestion(suggestions[highlightedIndex]);
                                        } else {
                                            handleAdd();
                                        }
                                    } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlightedIndex(i => Math.max(i - 1, -1));
                                    } else if (e.key === 'Escape') {
                                        setShowSuggestions(false);
                                    }
                                }}
                            />
                            <AnimatePresence>
                                {showSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute left-0 right-0 top-full mt-1 bg-card border border-border/60 shadow-2xl overflow-hidden z-50"
                                    >
                                        {suggestions.map((result, i) => (
                                            <button
                                                key={result.symbol}
                                                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(result); }}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === highlightedIndex
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'hover:bg-muted/40 text-foreground'
                                                    }`}
                                            >
                                                <span className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full ${result.type === 'etf'
                                                    ? 'text-violet-400'
                                                    : 'text-emerald-400'
                                                    }`}>
                                                    {result.type === 'etf'
                                                        ? <BarChart2 className="w-3.5 h-3.5" />
                                                        : <TrendingUp className="w-3.5 h-3.5" />}
                                                </span>
                                                <span className="font-black text-sm tracking-tight italic flex-none">{result.symbol}</span>
                                                <span className="text-xs text-muted-foreground truncate">{result.name}</span>
                                                <Badge
                                                    className={`ml-auto flex-none text-[9px] font-bold rounded-none px-1.5 py-0 border ${result.type === 'etf'
                                                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        }`}
                                                >
                                                    {result.type.toUpperCase()}
                                                </Badge>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={isPending || !newSymbol}
                            className={`rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all ${newSymbol && !isSearching && suggestions.length === 0 && !confirmedFromSuggestion
                                ? 'opacity-0 pointer-events-none w-0 px-0 overflow-hidden'
                                : 'opacity-100'
                                }`}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            ADD
                        </Button>
                    </div>
                </div>


            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/20 backdrop-blur-xl border border-border/50 p-6">
                <div>
                    <CardTitle className="text-xl font-black tracking-tighter uppercase italic text-primary">Your Assets</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Manage holdings and watchlists</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Button
                        onClick={handleTrackPerformance}
                        disabled={isTrackingPerformance || !portfolio_id}
                        variant="outline"
                        className="rounded-none border-primary/30 text-primary hover:bg-primary/5 font-black text-xs uppercase tracking-widest h-8 px-4 gap-2"
                    >
                        {isTrackingPerformance ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Tracking...</>
                        ) : (
                            <><Activity className="w-3.5 h-3.5" /> Track Performance</>
                        )}
                    </Button>

                    <Button
                        onClick={handleSuggestRebuild}
                        disabled={isSuggestingRebuild || !portfolio_id || isHealthExcellent}
                        variant="outline"
                        className="rounded-none border-amber-500/30 text-amber-400 hover:bg-amber-500/5 font-black text-xs uppercase tracking-widest h-8 px-4 gap-2"
                        title={isHealthExcellent ? "Portfolio health is already excellent (Score >= 85). Rebalancing not required." : "Get AI-driven rebalancing suggestion"}
                    >
                        {isSuggestingRebuild ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Suggesting...</>
                        ) : (
                            <><Scale className="w-3.5 h-3.5" /> Suggest Rebuild</>
                        )}
                    </Button>
                    <Button
                        onClick={handleOpenOptimizer}
                        disabled={selectedTickers.length <= 2}
                        className="rounded-none bg-primary/90 hover:bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-8 px-4 gap-2"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Build Portfolio
                    </Button>
                </div>
            </div>
            <div className="flex gap-6 items-start">
                <Card className="bg-card/10 backdrop-blur-md rounded-none border-border/50 shadow-2xl overflow-hidden w-1/3">
                    <CardHeader className="border-b border-border/50 bg-muted/5 px-2 py-4">
                        <span className="text-xl font-black tracking-tighter uppercase italic text-primary">Watchlist</span>
                        <div className="flex flex-col gap-2 w-full">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    placeholder="Search in your list..."
                                    className="pl-10 rounded-none bg-background/30 border-border/50 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Watchlist
                            watchlist={watchlist}
                            searchQuery={searchQuery}
                            handleDelete={handleDelete}
                            handleDeleteSelected={handleDeleteSelected}
                            handleClearAll={handleClearWatchlist}
                            isPending={isPending}
                            selectedSymbols={selectedTickers}
                            onSelectionChange={setSelectedTickers}
                        />

                    </CardContent>
                </Card>

                <Card className="bg-card/10 backdrop-blur-md rounded-none border-border/50 shadow-2xl overflow-hidden flex-1">
                    <UserPortfolio setPortfolioId={setPortfolio_id} />
                </Card>
            </div>

            {/* Portfolio Optimizer Dialog */}
            <PortfolioOptimizerDialog
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
                candidates={candidates}
                portfolio_id={portfolio_id}
                candidatesLoading={candidatesLoading}
                setOptimizationResult={setOptimizationResult}
                optimizationResult={optimizationResult}
            />

            {/* Performance Tracker Dialog */}
            <PerformanceTrackerDialog
                open={performanceDialogOpen}
                onOpenChange={setPerformanceDialogOpen}
                result={performanceResult}
                portfolioName={userPortfolios.find(p => p.id === portfolio_id)?.name || ""}
            />

            {/* Suggest Rebuild Dialog */}
            <SuggestRebuildDialog
                open={rebuildDialogOpen}
                onOpenChange={setRebuildDialogOpen}
                result={rebuildResult}
                portfolioId={portfolio_id}
                portfolioName={userPortfolios.find(p => p.id === portfolio_id)?.name || ""}
            />
        </div>
    );
};

export default BuildPortfolio;