export interface EnrichedWatchlistItem {
    id: number;
    symbol: string;
    sector: string | null;
    currentPrice: number | null;
    dividendYield: number | null;
    type: 'Stock' | 'ETF';
}

export type SortField = 'symbol' | 'sector' | 'currentPrice' | 'dividendYield';
export type SortDirection = 'asc' | 'desc';
export type TypeFilter = 'all' | 'Stock' | 'ETF';

export interface WatchlistProps {
    selectedSymbols: string[];
    onSelectionChange: (symbols: string[]) => void;
    onCreatePortfolio?: () => void;
    // Optional props for backward compatibility
    watchlist?: EnrichedWatchlistItem[];
    searchQuery?: string;
    handleDelete?: (symbol: string) => void;
    handleDeleteSelected?: () => void;
    handleClearAll?: () => void;
    isPending?: boolean;
}

export interface ConfirmDialogState {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    action: () => void;
}
