"use server";

import { db } from "@/lib/db";
import { investorDirectory, portfolioHoldings, tickers } from "@/lib/db/schema";
import { eq, asc, desc, inArray } from "drizzle-orm";

export async function getInvestors() {
  try {
    return await db.query.investorDirectory.findMany({
      where: eq(investorDirectory.is_active, true),
      orderBy: [asc(investorDirectory.display_name)],
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return [];
  }
}

export async function getInvestorHoldings(cik: string) {
  try {
    // 1. Fetch all holdings for this investor
    const allHoldings = await db.query.portfolioHoldings.findMany({
      where: eq(portfolioHoldings.cik, cik),
      orderBy: [desc(portfolioHoldings.report_date)],
    });

    if (allHoldings.length === 0) return [];

    // 2. Identify the latest and previous report dates
    const distinctDates = [...new Set(allHoldings.map(h => h.report_date.toISOString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const latestDate = distinctDates[0];
    const prevDate = distinctDates[1];

    const latestHoldings = allHoldings.filter(h => h.report_date.toISOString() === latestDate);
    const prevHoldings = allHoldings.filter(h => h.report_date.toISOString() === prevDate);

    const prevTickers = new Set(prevHoldings.map(h => h.ticker));

    // 3. Enrich with sector data
    const tickerSymbols = latestHoldings.map(h => h.ticker);
    const tickerMetadata = tickerSymbols.length > 0 ? await db.query.tickers.findMany({
      where: inArray(tickers.symbol, tickerSymbols),
      columns: { symbol: true, company_name: true, exchange: true }
    }) : [];

    const sectorMap = new Map(tickerMetadata.map(m => [m.symbol, m.company_name]));

    // 4. Process holdings
    return latestHoldings.map(h => ({
      ...h,
      sector: sectorMap.get(h.ticker) || "Unknown",
      isNewAddition: prevDate ? !prevTickers.has(h.ticker) : false,
    }));
  } catch (error) {
    console.error("Error fetching investor holdings:", error);
    return [];
  }
}
