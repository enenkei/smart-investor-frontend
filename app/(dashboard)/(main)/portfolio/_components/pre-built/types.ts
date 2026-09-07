import { LucideIcon, ShieldAlert, TrendingUp, Zap, ShieldCheck, Star, Layers } from "lucide-react";
import { StrategyHoldingDetail } from "@/lib/actions/strategies";

export interface Strategy {
  slug: string;
  display_name: string;
  tickers: string[];
  weights: Record<string, number>;
  expected_return: number;
  expected_volatility: number;
  updated_at: string | Date;
  mode: string;
}

export type StrategyMode = "stocks" | "etf" | "mix";

export interface StrategyTheme {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  tagline: string;
  why: string;
  criteria: string[];
  algorithmLogic: string;
}

export const STRATEGY_THEMES: StrategyTheme[] = [
  {
    id: "income-shield",
    name: "Income Shield",
    shortName: "Income Shield",
    icon: ShieldAlert,
    color: "text-amber-500",
    tagline: "Capital preservation with robust dividend yield cash flows",
    why: "Prioritizes high-yielding, low-beta assets that provide defensive income shields even during volatile equity corrections.",
    criteria: [
      "Income Score >= 0.70",
      "Dividend Yield between 2.0% - 16.0%",
      "Beta < 1.25 (Low volatility factor)",
      "Market Cap > $1B+ / ETF AUM > $50M+",
    ],
    algorithmLogic: "Defensive asset weighting prioritized by income yield spread and low downside market correlation.",
  },
  {
    id: "blue-chip-growth",
    name: "Blue Chip Growth",
    shortName: "Blue Chip",
    icon: TrendingUp,
    color: "text-sky-500",
    tagline: "Market leaders with compounding earnings and revenue velocity",
    why: "Focuses on established mega-cap and large-cap industry titans exhibiting consistent quarterly revenue and EPS acceleration.",
    criteria: [
      "Growth Score >= 0.80",
      "Market Cap > $10B+ (Large/Mega Cap)",
      "Revenue Growth > 8.0% YoY",
      "Robust Operating Cash Margins",
    ],
    algorithmLogic: "Momentum and growth vector weighting with high revenue quality persistence filters.",
  },
  {
    id: "deep-value-recovery",
    name: "Deep Value Recovery",
    shortName: "Deep Value",
    icon: Zap,
    color: "text-emerald-500",
    tagline: "Undervalued fundamentals poised for mean-reversion",
    why: "Identifies statistically discounted companies with strong balance sheet floors, low price-to-earnings, and solid free cash flow yields.",
    criteria: [
      "P/E Ratio between 4.0 - 18.0",
      "Market Cap > $2B+ / Efficiency Score >= 0.85",
      "Quality Score >= 0.45",
      "Positive Free Cash Flow Yield",
    ],
    algorithmLogic: "Mean-reversion value screener ranking assets by enterprise cash generation and valuation compression.",
  },
  {
    id: "dividend-growth",
    name: "Dividend Aristocrats",
    shortName: "Aristocrats",
    icon: ShieldCheck,
    color: "text-indigo-500",
    tagline: "Proven dividend champions with multi-year distribution growth",
    why: "Targets companies with an unbroken history of increasing shareholder dividends, backed by sustainable free cash flow and conservative payout ratios.",
    criteria: [
      "Dividend Growth Score >= 0.75",
      "5-Year Dividend CAGR > 3.0%",
      "Dividend Yield >= 1.0%",
      "Market Cap > $5B+ / Safety Score >= 0.60",
    ],
    algorithmLogic: "Compounding dividend durability model balancing yield magnitude with 5-year payout growth CAGR.",
  },
  {
    id: "high-quality",
    name: "Quality Kings",
    shortName: "Quality Kings",
    icon: Star,
    color: "text-yellow-500",
    tagline: "Fortress balance sheets, superior ROE, and competitive moats",
    why: "Constructed for investors seeking sleep-well-at-night security through companies with pristine credit, stellar return on equity (ROE), and high operating margins.",
    criteria: [
      "Quality Score >= 0.80",
      "Return on Equity (ROE) > 15.0%",
      "Market Cap > $10B+ / Safety Score >= 0.80",
      "Prudent Debt-to-Equity (< 1.5)",
    ],
    algorithmLogic: "Piotroski & Novy-Marx quality factor ranking combined with balance sheet strength and operating margin stability.",
  },
  {
    id: "total-return-titan",
    name: "Total Return Titan",
    shortName: "Total Return",
    icon: Layers,
    color: "text-purple-500",
    tagline: "Optimal risk-adjusted total return balancing capital growth and yield",
    why: "Combines high adaptive multi-factor scoring across growth, income, and quality to maximize Sharpe ratio and total compounding trajectory.",
    criteria: [
      "Adaptive Total Score >= 0.75",
      "Market Cap > $5B+ / Balanced Score >= 0.75",
      "Top Quartile Risk-Adjusted Profile",
      "Diversified Sector Breadth",
    ],
    algorithmLogic: "Multi-factor composite scoring model dynamically balancing capital appreciation momentum and income yield.",
  },
];

export const MODES: { id: StrategyMode; label: string; description: string }[] = [
  { id: "stocks", label: "Stocks Only", description: "100% Individual Equities" },
  { id: "etf", label: "ETFs Only", description: "100% Diversified Funds" },
  { id: "mix", label: "Hybrid (Mix)", description: "50% Stocks + 50% ETFs" },
];
