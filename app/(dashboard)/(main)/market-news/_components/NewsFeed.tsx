'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMarketNews } from '@/controllers/stock-data-controller';
import NewsCard from './NewsCard';
import { Loader2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, RefreshCw } from 'lucide-react';

const NewsFeed = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [activeTicker, setActiveTicker] = useState<string | null>(null);

    const fetchNews = useCallback(async (p: number, t: string | null) => {
        setLoading(true);
        try {
            const result = await getMarketNews(p, 10, t || undefined);
            setNews(result.news || []);
            setTotalPages(result.totalPages || 0);
        } catch (error) {
            console.error('Failed to fetch news:', error);
            setNews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews(page, activeTicker);
    }, [page, activeTicker, fetchNews]);

    const handleTickerClick = (ticker: string) => {
        setActiveTicker(ticker);
        setPage(1);
    };

    const clearFilter = () => {
        setActiveTicker(null);
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Intel News <span className="text-emerald-600">Feed</span></h2>
                    {activeTicker && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black shadow-lg shadow-emerald-600/20">
                            FILTER: ${activeTicker}
                            <button onClick={clearFilter} className="hover:text-emerald-200 transition-colors">
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 mr-2">
                        <button
                            onClick={() => fetchNews(page, activeTicker)}
                            className="p-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Refresh Feed"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(1)}
                            className="p-2 text-foreground hover:bg-background rounded-lg disabled:opacity-30 transition-all"
                            title="First Page"
                        >
                            <ChevronsLeft size={18} strokeWidth={2.5} />
                        </button>
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 text-foreground hover:bg-background rounded-lg disabled:opacity-30 transition-all"
                            title="Previous Page"
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        <span className="text-xs font-black tabular-nums px-3 min-w-[60px] text-center">
                            {page} / {totalPages || 1}
                        </span>
                        <button
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 text-foreground hover:bg-background rounded-lg disabled:opacity-30 transition-all"
                            title="Next Page"
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                        <button
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            className="p-2 text-foreground hover:bg-background rounded-lg disabled:opacity-30 transition-all"
                            title="Last Page"
                        >
                            <ChevronsRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <Loader2 className="animate-spin text-emerald-600" size={48} strokeWidth={3} />
                        <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse rounded-full" />
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-xs font-black text-foreground uppercase tracking-[0.3em] animate-pulse">Aggregating Intel</p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1">CROSS-REFERENCING TICKER SENTIMENT...</p>
                    </div>
                </div>
            ) : news.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {news.map((item, idx) => (
                        <NewsCard
                            key={item.url || idx}
                            news={item}
                            onTickerClick={handleTickerClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/50 transition-all hover:bg-muted/20">
                    <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-6">
                        <Filter className="text-muted-foreground/30" size={32} />
                    </div>
                    <p className="text-xl font-black text-foreground tracking-tight">No Intelligence Matches</p>
                    <p className="text-sm text-muted-foreground font-medium mt-2 max-w-xs text-center leading-relaxed">
                        We couldn't find any news articles matching your current filters. Try adjusting your search or check back later.
                    </p>
                    <button
                        onClick={clearFilter}
                        className="mt-8 px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Bottom Pagination */}
            {!loading && news.length > 0 && (
                <div className="flex items-center justify-center pt-10 pb-20">
                    <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
                        <button
                            disabled={page === 1}
                            onClick={() => {
                                setPage(1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 text-xs font-black hover:bg-muted rounded-xl disabled:opacity-30 transition-all flex items-center gap-1"
                            title="First Page"
                        >
                            <ChevronsLeft size={16} strokeWidth={3} />
                        </button>
                        <button
                            disabled={page === 1}
                            onClick={() => {
                                setPage(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 text-xs font-black hover:bg-muted rounded-xl disabled:opacity-30 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                            PREVIOUS
                        </button>
                        <div className="w-px h-4 bg-border mx-2" />
                        <span className="text-xs font-black tabular-nums px-4">
                            PAGE {page} <span className="text-muted-foreground">OF</span> {totalPages}
                        </span>
                        <div className="w-px h-4 bg-border mx-2" />
                        <button
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 text-xs font-black hover:bg-muted rounded-xl disabled:opacity-30 transition-all flex items-center gap-2"
                        >
                            NEXT
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(totalPages);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 text-xs font-black hover:bg-muted rounded-xl disabled:opacity-30 transition-all flex items-center gap-1"
                            title="Last Page"
                        >
                            <ChevronsRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsFeed;
