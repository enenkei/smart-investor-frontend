export interface ETF {
  symbol: string;
  name: string;
  yield: number;
  rsi: number;
  expense_ratio: number;
  tax_form: "1099" | "K-1";
  price_vs_52w: number; // 0 to 1
  asset_class: "Equity" | "Fixed Income" | "Commodities" | "Specialty";
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  yield: number;
  dividend_cagr_5y: number;
  payout_ratio: number;
  pe_ratio: number;
  fcf_yield: number;
  rsi: number;
  quality_score: number;
  market_cap: string;
  dist_52w_low: number;
}

export const mockETFs: ETF[] = [
  {
    symbol: "JEPQ",
    name: "JPMorgan Nasdaq Equity Premium Income ETF",
    yield: 9.2,
    rsi: 38.5,
    expense_ratio: 0.35,
    tax_form: "1099",
    price_vs_52w: 0.45,
    asset_class: "Equity",
  },
  {
    symbol: "JEPI",
    name: "JPMorgan Equity Premium Income ETF",
    yield: 7.5,
    rsi: 32.1,
    expense_ratio: 0.35,
    tax_form: "1099",
    price_vs_52w: 0.25,
    asset_class: "Equity",
  },
  {
    symbol: "DIVO",
    name: "Amplify CWP Strategic Focus Equity ETF",
    yield: 4.8,
    rsi: 45.2,
    expense_ratio: 0.55,
    tax_form: "1099",
    price_vs_52w: 0.65,
    asset_class: "Equity",
  },
  {
    symbol: "SCHD",
    name: "Schwab US Dividend Equity ETF",
    yield: 3.4,
    rsi: 58.7,
    expense_ratio: 0.06,
    tax_form: "1099",
    price_vs_52w: 0.85,
    asset_class: "Equity",
  },
  {
    symbol: "TLT",
    name: "iShares 20+ Year Treasury Bond ETF",
    yield: 3.8,
    rsi: 28.4,
    expense_ratio: 0.15,
    tax_form: "1099",
    price_vs_52w: 0.15,
    asset_class: "Fixed Income",
  },
  {
    symbol: "GLD",
    name: "SPDR Gold Shares",
    yield: 0.0,
    rsi: 72.1,
    expense_ratio: 0.40,
    tax_form: "1099",
    price_vs_52w: 0.92,
    asset_class: "Commodities",
  },
  {
    symbol: "AMLX",
    name: "Amplify High Income ETF",
    yield: 12.4,
    rsi: 35.6,
    expense_ratio: 0.85,
    tax_form: "K-1",
    price_vs_52w: 0.38,
    asset_class: "Specialty",
  },
  {
    symbol: "VYM",
    name: "Vanguard High Dividend Yield ETF",
    yield: 2.8,
    rsi: 62.3,
    expense_ratio: 0.06,
    tax_form: "1099",
    price_vs_52w: 0.78,
    asset_class: "Equity",
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    yield: 3.2,
    rsi: 48.9,
    expense_ratio: 0.03,
    tax_form: "1099",
    price_vs_52w: 0.55,
    asset_class: "Fixed Income",
  },
  {
    symbol: "UTG",
    name: "Reaves Utility Income Fund",
    yield: 8.1,
    rsi: 31.2,
    expense_ratio: 1.15,
    tax_form: "1099",
    price_vs_52w: 0.22,
    asset_class: "Equity",
  }
];

export const mockStocks: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    yield: 0.5,
    dividend_cagr_5y: 8.2,
    payout_ratio: 15.3,
    pe_ratio: 28.5,
    fcf_yield: 3.8,
    rsi: 42.1,
    quality_score: 95,
    market_cap: "3.0T",
    dist_52w_low: 12.5,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    yield: 0.7,
    dividend_cagr_5y: 10.1,
    payout_ratio: 25.4,
    pe_ratio: 32.4,
    fcf_yield: 3.2,
    rsi: 34.5, // Low RSI
    quality_score: 98, // High Quality -> Should have Double Green Border
    market_cap: "2.8T",
    dist_52w_low: 8.2,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financials",
    yield: 2.4,
    dividend_cagr_5y: 12.5,
    payout_ratio: 32.1,
    pe_ratio: 11.2,
    fcf_yield: 4.5,
    rsi: 55.3,
    quality_score: 82,
    market_cap: "500B",
    dist_52w_low: 15.1,
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    yield: 2.9,
    dividend_cagr_5y: 6.1,
    payout_ratio: 44.5,
    pe_ratio: 15.4,
    fcf_yield: 5.2,
    rsi: 31.2, // Low RSI
    quality_score: 88, // High Quality -> Should have Double Green Border
    market_cap: "420B",
    dist_52w_low: 4.5,
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    sector: "Financials",
    yield: 0.8,
    dividend_cagr_5y: 15.2,
    payout_ratio: 21.3,
    pe_ratio: 25.6,
    fcf_yield: 4.1,
    rsi: 48.7,
    quality_score: 92,
    market_cap: "520B",
    dist_52w_low: 9.8,
  },
  {
    symbol: "PG",
    name: "Procter & Gamble Co.",
    sector: "Consumer Staples",
    yield: 2.5,
    dividend_cagr_5y: 5.4,
    payout_ratio: 58.2,
    pe_ratio: 24.1,
    fcf_yield: 4.8,
    rsi: 62.4,
    quality_score: 85,
    market_cap: "380B",
    dist_52w_low: 11.2,
  },
  {
    symbol: "CVX",
    name: "Chevron Corporation",
    sector: "Energy",
    yield: 4.1,
    dividend_cagr_5y: 6.2,
    payout_ratio: 42.1,
    pe_ratio: 12.5,
    fcf_yield: 6.5,
    rsi: 28.5, // Low RSI
    quality_score: 75, // Quality not > 80
    market_cap: "280B",
    dist_52w_low: 3.2,
  },
  {
    symbol: "KO",
    name: "The Coca-Cola Company",
    sector: "Consumer Staples",
    yield: 3.1,
    dividend_cagr_5y: 3.5,
    payout_ratio: 68.4,
    pe_ratio: 22.1,
    fcf_yield: 4.2,
    rsi: 33.1, // Low RSI
    quality_score: 81, // High Quality -> Double Green Border
    market_cap: "260B",
    dist_52w_low: 5.1,
  }
];
