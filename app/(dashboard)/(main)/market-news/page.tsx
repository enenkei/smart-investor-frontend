import React from 'react';
import { getMarketSentiment, getBenchmarkData } from '@/controllers/stock-data-controller';
import { Zap } from 'lucide-react';
import SentimentGauge from './_components/SentimentGauge';
import BenchmarkSparklines from './_components/BenchmarkSparklines';
import NewsFeed from './_components/NewsFeed';
import MacroLinkSidebar from './_components/MacroLinkSidebar';

const MarketNewsPage = async () => {
    const sentiment = await getMarketSentiment();
    const benchmarks = await getBenchmarkData();

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-10 bg-background min-h-screen text-primary">
            {/* Page Title Header */}
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Zap size={14} className="fill-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Intelligence</span>
                </div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">The Market <span className="text-emerald-600">Pulse</span></h1>
                <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                    Real-time sentiment analysis and benchmark performance tracking.
                </p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Content Column */}
                <div className="xl:col-span-8 flex flex-col gap-10">
                    {/* Top Stats Section */}
                    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        <div className="md:col-span-3">
                            <SentimentGauge sentiment={sentiment} />
                        </div>
                        <div className="md:col-span-9">
                            <BenchmarkSparklines benchmarks={benchmarks} />
                        </div>
                    </section>

                    {/* Separator */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-100" />

                    {/* News Feed Section */}
                    <section className="flex flex-col gap-6">
                        <NewsFeed />
                    </section>
                </div>

                {/* Right Sidebar Rail */}
                <aside className="xl:col-span-4 flex flex-col gap-6">
                    <div className="sticky top-24">
                        <MacroLinkSidebar />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MarketNewsPage;