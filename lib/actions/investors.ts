"use server";

import { prisma } from "@/lib/prisma";

export async function getInvestors() {
  try {
    return await prisma.investor_directory.findMany({
      where: { is_active: true },
      orderBy: { display_name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return [];
  }
}

export async function getInvestorHoldings(cik: string) {
  try {
    // 1. Fetch all holdings for this investor
    const allHoldings = await prisma.portfolio_holdings.findMany({
      where: { cik },
      orderBy: { report_date: "desc" },
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
    const tickers = latestHoldings.map(h => h.ticker);
    const tickerMetadata = await prisma.tickers.findMany({
      where: { symbol: { in: tickers } },
      select: { symbol: true, company_name: true, exchange: true }
    });

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
