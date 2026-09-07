"use server";

import { db } from "@/lib/db";
import { strategies, fundamentalScores, etfScores, etfMetadata } from "@/lib/db/schema";
import { desc, sql, inArray, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface StrategyHoldingDetail {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  dividend_yield: number;
  beta: number;
  score: number;
  type: "Stock" | "ETF";
}

const THEME_DEFINITIONS = [
  {
    id: "income-shield",
    name: "Income Shield",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, income_score as score
      FROM fundamental_scores
      WHERE income_score >= 0.70 
        AND dividend_yield > 2.0 AND dividend_yield < 16.0
        AND (beta IS NULL OR beta < 1.25)
        AND market_cap > 1000000000
      ORDER BY income_score DESC, dividend_yield DESC
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, income_score as score
      FROM etf_scores
      WHERE income_score >= 0.80 
        AND annual_dividend_yield_pct >= 2.5
        AND (beta IS NULL OR beta < 1.15)
        AND total_assets > 50000000
      ORDER BY income_score DESC, annual_dividend_yield_pct DESC
      LIMIT 8
    `,
    baseReturn: 0.098,
    baseVol: 0.105,
  },
  {
    id: "blue-chip-growth",
    name: "Blue Chip Growth",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, growth_score as score, revenue_growth
      FROM fundamental_scores
      WHERE growth_score >= 0.80
        AND market_cap > 10000000000
        AND revenue_growth > 0.08
      ORDER BY growth_score DESC, revenue_growth DESC
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, growth_score as score
      FROM etf_scores
      WHERE growth_score >= 0.85
        AND total_assets > 100000000
      ORDER BY growth_score DESC, total_assets DESC
      LIMIT 8
    `,
    baseReturn: 0.165,
    baseVol: 0.185,
  },
  {
    id: "deep-value-recovery",
    name: "Deep Value Recovery",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, quality_score as score, pe_ratio
      FROM fundamental_scores
      WHERE pe_ratio > 4.0 AND pe_ratio < 18.0
        AND market_cap > 2000000000
        AND quality_score >= 0.45
      ORDER BY pe_ratio ASC, fcf_yield DESC NULLS LAST
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, efficiency_score as score
      FROM etf_scores
      WHERE efficiency_score >= 0.85
        AND total_assets > 50000000
      ORDER BY efficiency_score DESC, balanced_score DESC
      LIMIT 8
    `,
    baseReturn: 0.128,
    baseVol: 0.148,
  },
  {
    id: "dividend-growth",
    name: "Dividend Aristocrats",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, dividend_growth_score as score, dividend_cagr_5y
      FROM fundamental_scores
      WHERE dividend_growth_score >= 0.75
        AND dividend_cagr_5y > 0.03
        AND dividend_yield >= 1.0
        AND market_cap > 5000000000
      ORDER BY dividend_growth_score DESC, dividend_cagr_5y DESC
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, (income_score + safety_score)/2 as score
      FROM etf_scores
      WHERE income_score >= 0.75
        AND safety_score >= 0.60
        AND annual_dividend_yield_pct >= 2.0
        AND total_assets > 100000000
      ORDER BY (income_score + safety_score) DESC
      LIMIT 8
    `,
    baseReturn: 0.118,
    baseVol: 0.118,
  },
  {
    id: "high-quality",
    name: "Quality Kings",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, quality_score as score, roe
      FROM fundamental_scores
      WHERE quality_score >= 0.80
        AND roe > 0.15
        AND market_cap > 10000000000
      ORDER BY quality_score DESC, roe DESC
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, (safety_score + efficiency_score)/2 as score
      FROM etf_scores
      WHERE safety_score >= 0.80
        AND efficiency_score >= 0.70
        AND total_assets > 100000000
      ORDER BY (safety_score + efficiency_score) DESC
      LIMIT 8
    `,
    baseReturn: 0.145,
    baseVol: 0.135,
  },
  {
    id: "total-return-titan",
    name: "Total Return Titan",
    stockQuery: sql`
      SELECT ticker, dividend_yield, beta, adaptive_total_score as score
      FROM fundamental_scores
      WHERE adaptive_total_score >= 0.75
        AND market_cap > 5000000000
      ORDER BY adaptive_total_score DESC, quality_score DESC
      LIMIT 8
    `,
    etfQuery: sql`
      SELECT symbol as ticker, annual_dividend_yield_pct as dividend_yield, beta, balanced_score as score
      FROM etf_scores
      WHERE balanced_score >= 0.75
        AND total_assets > 100000000
      ORDER BY balanced_score DESC, growth_score DESC
      LIMIT 8
    `,
    baseReturn: 0.134,
    baseVol: 0.138,
  },
];

const RANK_WEIGHTS_8 = [0.18, 0.16, 0.14, 0.13, 0.11, 0.10, 0.09, 0.09];

export async function generatePreBuiltStrategies() {
  try {
    for (const theme of THEME_DEFINITIONS) {
      const sRows = (await db.execute(theme.stockQuery)).rows;
      const eRows = (await db.execute(theme.etfQuery)).rows;

      const stockTickers = sRows.map((r) => String(r.ticker));
      const etfTickers = eRows.map((r) => String(r.ticker));
      const mixTickers = [...stockTickers.slice(0, 4), ...etfTickers.slice(0, 4)];

      const makeWeights = (tickersList: string[]) => {
        const weightsObj: Record<string, number> = {};
        tickersList.forEach((t, i) => {
          weightsObj[t] = RANK_WEIGHTS_8[i] || Number((1 / tickersList.length).toFixed(3));
        });
        return weightsObj;
      };

      const strategiesToSave = [
        {
          slug: `${theme.id}-stocks`,
          display_name: `${theme.name} (Stocks)`,
          tickers: stockTickers,
          weights: makeWeights(stockTickers),
          expected_return: theme.baseReturn,
          expected_volatility: theme.baseVol,
          mode: "stocks",
        },
        {
          slug: `${theme.id}-etf`,
          display_name: `${theme.name} (ETF)`,
          tickers: etfTickers,
          weights: makeWeights(etfTickers),
          expected_return: Number((theme.baseReturn * 0.92).toFixed(4)),
          expected_volatility: Number((theme.baseVol * 0.88).toFixed(4)),
          mode: "etf",
        },
        {
          slug: `${theme.id}-mix`,
          display_name: `${theme.name} (Mix)`,
          tickers: mixTickers,
          weights: makeWeights(mixTickers),
          expected_return: Number((theme.baseReturn * 0.96).toFixed(4)),
          expected_volatility: Number((theme.baseVol * 0.93).toFixed(4)),
          mode: "mix",
        },
        // Base alias for backwards compatibility
        {
          slug: theme.id,
          display_name: theme.name,
          tickers: mixTickers,
          weights: makeWeights(mixTickers),
          expected_return: Number((theme.baseReturn * 0.96).toFixed(4)),
          expected_volatility: Number((theme.baseVol * 0.93).toFixed(4)),
          mode: "mix",
        },
      ];

      for (const item of strategiesToSave) {
        await db
          .insert(strategies)
          .values({
            slug: item.slug,
            display_name: item.display_name,
            tickers: item.tickers,
            weights: item.weights,
            expected_return: item.expected_return,
            expected_volatility: item.expected_volatility,
            mode: item.mode,
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: strategies.slug,
            set: {
              display_name: item.display_name,
              tickers: item.tickers,
              weights: item.weights,
              expected_return: item.expected_return,
              expected_volatility: item.expected_volatility,
              mode: item.mode,
              updated_at: new Date(),
            },
          });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error generating pre-built strategies:", error);
    throw error;
  }
}

export async function getStrategies() {
  try {
    let result = await db.query.strategies.findMany({
      orderBy: [desc(strategies.updated_at)],
    });

    if (!result || result.length === 0) {
      await generatePreBuiltStrategies();
      result = await db.query.strategies.findMany({
        orderBy: [desc(strategies.updated_at)],
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return [];
  }
}

export async function reseedPreBuiltStrategies() {
  try {
    await generatePreBuiltStrategies();
    revalidatePath("/portfolio");
    return { success: true };
  } catch (error: any) {
    console.error("Error reseeding strategies:", error);
    return { success: false, error: error.message };
  }
}

export async function getStrategyHoldingsDetails(tickersList: string[]): Promise<StrategyHoldingDetail[]> {
  if (!tickersList || tickersList.length === 0) return [];

  try {
    const stocks = await db
      .select({
        ticker: fundamentalScores.ticker,
        name: fundamentalScores.name,
        sector: fundamentalScores.sector,
        current_price: fundamentalScores.current_price,
        dividend_yield: fundamentalScores.dividend_yield,
        beta: fundamentalScores.beta,
        score: fundamentalScores.adaptive_total_score,
      })
      .from(fundamentalScores)
      .where(inArray(fundamentalScores.ticker, tickersList));

    const etfs = await db
      .select({
        symbol: etfMetadata.symbol,
        etf_name: etfMetadata.etf_name,
        asset_class: etfMetadata.asset_class,
        previous_closing_price: etfMetadata.previous_closing_price,
        annual_dividend_yield_pct: etfMetadata.annual_dividend_yield_pct,
        beta: etfScores.beta,
        score: etfScores.balanced_score,
      })
      .from(etfMetadata)
      .leftJoin(etfScores, eq(etfMetadata.symbol, etfScores.symbol))
      .where(inArray(etfMetadata.symbol, tickersList));

    const stockMap = new Map(stocks.map((s) => [s.ticker.toUpperCase(), s]));
    const etfMap = new Map(etfs.map((e) => [e.symbol.toUpperCase(), e]));

    // Preserve the original ordering of tickersList
    return tickersList
      .map((rawTicker) => {
        const t = rawTicker.toUpperCase();
        if (stockMap.has(t)) {
          const s = stockMap.get(t)!;
          return {
            ticker: s.ticker,
            name: s.name || s.ticker,
            sector: s.sector || "Equities",
            price: s.current_price ?? 0,
            dividend_yield: s.dividend_yield ?? 0,
            beta: s.beta ?? 1.0,
            score: s.score ?? 0.5,
            type: "Stock" as const,
          };
        } else if (etfMap.has(t)) {
          const e = etfMap.get(t)!;
          return {
            ticker: e.symbol,
            name: e.etf_name || e.symbol,
            sector: e.asset_class || "ETF",
            price: e.previous_closing_price ?? 0,
            dividend_yield: e.annual_dividend_yield_pct ?? 0,
            beta: e.beta ?? 1.0,
            score: e.score ?? 0.5,
            type: "ETF" as const,
          };
        }
        return {
          ticker: rawTicker,
          name: rawTicker,
          sector: "Asset",
          price: 0,
          dividend_yield: 0,
          beta: 1.0,
          score: 0.5,
          type: "Stock" as const,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Error fetching strategy holdings details:", err);
    return [];
  }
}

