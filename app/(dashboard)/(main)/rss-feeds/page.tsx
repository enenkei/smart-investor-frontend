'use client'
import { useEffect, useState } from "react";
import RSSScout from "./_components/RSSScout";
import { getRSSFeeds } from "@/controllers/stock-data-controller";
import { LoaderIcon, ZapIcon } from "lucide-react";

const RssFeedsPage = () => {
    const [rssFeeds, setRssFeeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const rssFeeds = await getRSSFeeds();
            setRssFeeds(rssFeeds);
            setLoading(false);
        };
        fetchData();
    }, []);
    return (
        <div className="flex flex-col gap-8 p-6 lg:p-10 bg-background min-h-screen text-primary">
            {/* Header */}
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-500">
                    <ZapIcon size={14} className="fill-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Intelligence</span>
                </div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">The Market <span className="text-emerald-600">Pulse</span></h1>
                <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                    Real-time sentiment analysis and benchmark performance tracking.
                </p>
            </header>
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LoaderIcon className="animate-spin" size={20} />
                </div>
            ) : (
                <RSSScout feeds={rssFeeds} />
            )}
        </div>
    );
};

export default RssFeedsPage;
