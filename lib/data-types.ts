export interface SystemSettings {
    aiModel: string;
    logSize: number;
    databaseUrl: string;
    sessionDuration: number;
    apiKey: string | null;
    stockApiProvider: string | null;
    stockApiKey: string | null;
    stockApiBaseUrl: string | null;
}

export interface Projection {
    year: number;
    value: number;
    income: number;
}

export interface Metrics {
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
    dividend_yield: number;
    target_monthly_income: number;
    /**
     * This requirements_to_target object shows the required monthly contribution you would need to make to 
     * hit your target capital (and thus target income) at exactly Year 5, 10, 15, 20, 25, and 30, 
     * assuming the portfolio's expected return.
     * "5": 1450.25,
     * "10": 800.10,
     * "15": 400.50,
     * "20": 150.00,
     * "25": 0.00,
     * "30": 0.00
     * A value of 0.00 means your starting capital alone will compound enough 
     * to hit the target by that year without any additional monthly contributions!
     */
    requirements_to_target?: Record<string, number>;
}

export interface OptimizedPortfolio {
    success?: boolean;
    error?: string;
    message?: string;
    tickers: string[];
    weights: Record<string, number>;
    prices: Record<string, number>;
    shares: Record<string, number>;
    projections: Projection[];
    metrics: Metrics;
}

export interface Asset {
    symbol: string;
    shares: number | null;
    avg_cost_basis: number | null;
}

export const ALPHA_VANTAGE_API = "ALPHA_VANTAGE_API"
export const GOOGLE_GENERATIVE_AI_API_KEY = "GOOGLE_GENERATIVE_AI_API_KEY"
export const AI_MODEL = "AI_MODEL"