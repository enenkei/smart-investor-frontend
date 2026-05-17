'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

interface TickerSentiment {
  ticker: string;
  relevance_score: string | number;
  ticker_sentiment_score: string | number;
  ticker_sentiment_label: string;
}

interface NewsCardProps {
  news: {
    url: string;
    title: string;
    summary?: string | null;
    banner_image?: string | null;
    source?: string | null;
    source_domain?: string | null;
    time_published: Date | string | null;
    overall_sentiment_label?: string | null;
    ticker_sentiment?: any;
    topics?: any;
  };
  onTickerClick?: (ticker: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onTickerClick }) => {
  const publishedAt = news.time_published ? new Date(news.time_published) : null;
  const tickers: TickerSentiment[] = Array.isArray(news.ticker_sentiment) ? news.ticker_sentiment : [];
  const setHoveredTopic = useUIStore(state => state.setHoveredTopic);
  
  const topics = Array.isArray(news.topics) ? news.topics : [];

  const handleMouseEnter = () => {
    // Find the first macro-relevant topic
    const macroTopics = ['inflation', 'gdp', 'retail', 'manufacturing', 'employment'];
    const found = topics.find((t: any) => macroTopics.includes(t.topic?.toLowerCase()));
    if (found) {
        setHoveredTopic(found.topic);
    }
  };

  const getSentimentColor = (label: string | null) => {
    switch (label?.toLowerCase()) {
      case 'bullish':
      case 'somewhat-bullish':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'bearish':
      case 'somewhat-bearish':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getTickerSentimentIcon = (score: string | number) => {
    const num = Number(score);
    if (num > 0.15) return <TrendingUp size={10} className="text-emerald-500" />;
    if (num < -0.15) return <TrendingDown size={10} className="text-rose-500" />;
    return <Minus size={10} className="text-slate-400" />;
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHoveredTopic(null)}
      className="group bg-card hover:bg-slate-50/50 border border-border rounded-none p-5 transition-all duration-300 hover:shadow-md flex flex-col gap-4"
    >
      {/* Top Row: Source & Time */}
      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-foreground uppercase">{news.source || 'Unknown'}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="lowercase font-medium">{news.source_domain}</span>
        </div>
        <div className="text-muted-foreground/60 tabular-nums">
          {publishedAt ? formatDistanceToNow(publishedAt, { addSuffix: true }) : 'N/A'}
        </div>
      </div>

      {/* Title */}
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
      >
        <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-emerald-600 transition-colors flex items-start gap-2">
          {news.title}
          <ExternalLink size={14} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </h3>
      </a>

      {/* Summary (Optional/Truncated) */}
      {news.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {news.summary}
        </p>
      )}

      {/* Intel Footer */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
        {/* Sentiment Pill */}
        <div className={`px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-wider border ${getSentimentColor(news.overall_sentiment_label || null)}`}>
          {news.overall_sentiment_label?.replace('-', ' ') || 'Neutral'}
        </div>

        {/* Ticker Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tickers.slice(0, 5).map((t, idx) => (
            <button
              key={`${t.ticker}-${idx}`}
              onClick={() => onTickerClick?.(t.ticker)}
              className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 hover:bg-emerald-600 hover:text-white border border-border rounded-lg text-[10px] font-black transition-all group/ticker"
            >
              <span className="text-emerald-600 group-hover/ticker:text-white">$</span>
              {t.ticker}
              {getTickerSentimentIcon(t.ticker_sentiment_score)}
              <span className="text-[9px] text-muted-foreground group-hover/ticker:text-emerald-100 font-medium ml-0.5">
                {Math.round(Number(t.relevance_score) * 100)}%
              </span>
            </button>
          ))}
          {tickers.length > 5 && (
            <span className="text-[10px] font-bold text-muted-foreground/60">+{tickers.length - 5}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
