export interface PerformanceChartPoint {
    date: string;
    portfolio: number;
    benchmark: number;
}

export interface AssetAttribution {
    symbol: string;
    shares: number;
    start_price: number;
    current_price: number;
    current_value: number;
    weight: number;
    return: number;
    contribution: number;
}

export interface PerformanceResult {
    success: boolean;
    benchmark: string;
    timeframe?: string;
    health: {
        score: number;
        grade: string;
        status: string;
        description: string;
        components?: {
            sharpe_score?: number;
            return_vs_benchmark_score?: number;
            drawdown_score?: number;
            diversification_score?: number;
        };
    };
    metrics: {
        portfolio_return?: number;
        benchmark_return?: number;
        excess_return?: number;
        annualized_portfolio_return?: number;
        annualized_benchmark_return?: number;
        portfolio_return_1y: number;
        benchmark_return_1y: number;
        portfolio_volatility?: number;
        benchmark_volatility?: number;
        portfolio_volatility_1y: number;
        benchmark_volatility_1y: number;
        downside_volatility?: number;
        empirical_beta: number;
        capm_alpha: number;
        sharpe_ratio: number;
        sortino_ratio?: number;
        calmar_ratio?: number;
        max_drawdown: number;
        diversification_score: number;
    };
    chart_data?: PerformanceChartPoint[];
    asset_attribution?: AssetAttribution[];
    current_prices: Record<string, number>;
}

export interface YearSnapshot {
    year: number;
    portfolioValue: number;
    totalContributed: number;
    annualDividends: number;
    monthlyDividends: number;
    yieldOnCostPct: number;
    cumulativeDividends: number;
    reinvestedGains: number;
    isCrossover: boolean;
}

export const BENCHMARK_OPTIONS = [
    { value: "^GSPC", label: "S&P 500", desc: "US Large Cap blend" },
    { value: "^NDX", label: "Nasdaq 100", desc: "Tech & Growth heavy" },
    { value: "^DJI", label: "Dow Jones", desc: "US Blue Chip Value" },
    { value: "^RUT", label: "Russell 2000", desc: "US Small Cap Equities" },
    { value: "SCHD", label: "SCHD Dividend", desc: "High-Quality Dividend Equity" },
];

export const TIMEFRAME_OPTIONS = [
    { value: "1mo", label: "1M" },
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "3y", label: "3Y" },
    { value: "5y", label: "5Y" },
];
