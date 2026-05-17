'use client';

import React, { useEffect, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { getRSSItems } from '@/controllers/stock-data-controller';
import { Radio, ExternalLink, Calendar, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RSSScoutProps {
    feeds: any[];
}

const RSSScout: React.FC<RSSScoutProps> = ({ feeds }) => {
    const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedFeedId && selectedFeedId !== 'none') {
            const fetchItems = async () => {
                setLoading(true);
                const feedItems = await getRSSItems(parseInt(selectedFeedId));
                setItems(feedItems);
                setLoading(false);
            };
            fetchItems();
        } else {
            setItems([]);
        }
    }, [selectedFeedId]);

    const selectedFeed = feeds.find(f => f.id.toString() === selectedFeedId);

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Feed Selection */}
            <div className="flex flex-col gap-3 max-w-xl">
                <div className="flex items-center gap-2">
                    <Radio size={16} className="text-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Select Intelligence Source</h3>
                </div>
                <Select onValueChange={setSelectedFeedId} value={selectedFeedId || undefined}>
                    <SelectTrigger className="w-full bg-card/50 border-border/50 h-12 text-sm backdrop-blur-sm">
                        <SelectValue placeholder="Choose an RSS feed to explore..." />
                    </SelectTrigger>
                    <SelectContent>
                        {feeds.map((feed) => (
                            <SelectItem key={feed.id} value={feed.id.toString()}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        feed.is_active ? "bg-emerald-500" : "bg-rose-500"
                                    )} />
                                    <span className="font-medium">{feed.name}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2 opacity-60">({feed.category})</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Feed Content Grid */}
            {selectedFeedId && selectedFeedId !== 'none' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-end border-b border-border/50 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight text-foreground">
                                {selectedFeed?.name}
                            </h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                {selectedFeed?.category} 
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full" />
                                {selectedFeed?.url}
                            </p>
                        </div>
                        {selectedFeed?.last_updated && (
                            <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-none border border-primary/20 tracking-widest">
                                LAST SYNC: {formatDistanceToNow(new Date(selectedFeed.last_updated), { addSuffix: true }).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <span className="text-sm font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Scanning Archive...</span>
                        </div>
                    ) : items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item) => (
                                <Card key={item.id} className="group border-border/40 bg-card/20 hover:bg-card/40 transition-all duration-300 flex flex-col hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                                    <CardHeader className="p-5 pb-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <CardTitle className="text-sm font-bold leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                                                {item.title}
                                            </CardTitle>
                                            <a 
                                                href={item.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded bg-muted/30 text-muted-foreground hover:bg-primary hover:text-white transition-all shrink-0 shadow-sm"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between gap-4">
                                        {item.summary && (
                                            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                {item.summary.replace(/<[^>]*>?/gm, '').trim()}
                                            </p>
                                        )}

                                        <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={10} className="text-primary/40" />
                                                    <span>{formatDistanceToNow(new Date(item.published_at || item.fetched_at), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                            {item.author && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-primary/60 truncate">
                                                    <User size={10} />
                                                    <span className="truncate">{item.author}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-32 text-center border-2 border-dashed border-border/20 rounded-xl">
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">Zero Intelligence Reports Found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RSSScout;
