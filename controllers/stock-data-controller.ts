'use server'

import { db } from "@/lib/db";
import {
    marketNews,
    rssFeeds,
    rssItems,
    indexData,
    etfMetadata,
    etfCategories,
    etfCategoryMappings,
    fundamentalScores,
    watchlists,
} from "@/lib/db/schema";
import {
    eq,
    and,
    or,
    gte,
    lte,
    desc,
    inArray,
    ilike,
    isNotNull,
    count,
    sql
} from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getMarketNews = async (page: number = 1, limit: number = 20, ticker?: string) => {
    try {
        const conditions = [];

        if (ticker) {
            conditions.push(sql`${marketNews.ticker_sentiment} @> ${JSON.stringify([{ ticker }])}::jsonb`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (page - 1) * limit;

        const [news, [{ count: totalCount }]] = await Promise.all([
            db
                .select()
                .from(marketNews)
                .where(whereClause)
                .orderBy(desc(marketNews.time_published))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: count() })
                .from(marketNews)
                .where(whereClause)
        ]);

        const total = Number(totalCount || 0);

        return {
            news,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error fetching market news:', error);
        return { news: [], total: 0, page: 1, totalPages: 0 };
    }
}

export const getFeeds = async () => {
    try {
        const feeds = await db.query.rssFeeds.findMany();
        return feeds;
    } catch (error) {
        console.error('Error fetching feeds:', error);
        return [];
    }
}

export const getCommodities = async () => {
    try {
        const result = await db.query.commodities.findMany();
        return result;
    } catch (error) {
        console.error('Error fetching commodities:', error);
        return [];
    }
}

export const getMarketSentiment = async () => {
    try {
        const news = await db
            .select({
                overall_sentiment_score: marketNews.overall_sentiment_score
            })
            .from(marketNews)
            .orderBy(desc(marketNews.time_published))
            .limit(100);

        if (news.length === 0) return 0;

        const totalSentiment = news.reduce((acc, item) => {
            return acc + Number(item.overall_sentiment_score || 0);
        }, 0);

        return totalSentiment / news.length;
    } catch (error) {
        console.error('Error calculating market sentiment:', error);
        return 0;
    }
}

export const getBenchmarkData = async () => {
    try {
        const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
        const data = await db.query.indexData.findMany({
            where: inArray(indexData.symbol, symbols)
        });
        return data;
    } catch (error) {
        console.error('Error fetching benchmark data:', error);
        return [];
    }
}

export const getMacroData = async () => {
    try {
        const [indicators, commodityData] = await Promise.all([
            db.query.economicIndicators.findMany(),
            db.query.commodities.findMany()
        ]);
        return {
            indicators: indicators.map(i => ({ ...i, data: typeof i.data === 'string' ? JSON.parse(i.data) : i.data })),
            commodities: commodityData.map(c => ({ ...c, data: typeof c.data === 'string' ? JSON.parse(c.data) : c.data }))
        };
    } catch (error) {
        console.error('Error fetching macro data:', error);
        return { indicators: [], commodities: [] };
    }
}

export const getRSSFeeds = async () => {
    try {
        const feeds = await db
            .select({
                id: rssFeeds.id,
                name: rssFeeds.name,
                url: rssFeeds.url,
                is_active: rssFeeds.is_active,
                last_updated: rssFeeds.last_updated
            })
            .from(rssFeeds);

        return feeds;
    } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        return [];
    }
}

export const getRSSItems = async (feedId: number) => {
    try {
        const items = await db.query.rssItems.findMany({
            where: eq(rssItems.feed_id, feedId),
            orderBy: [desc(rssItems.published_at)],
            limit: 20
        });
        return items;
    } catch (error) {
        console.error(`Error fetching RSS items for feed ${feedId}:`, error);
        return [];
    }
}

export const getETFs = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    minYield?: number;
    maxRsi?: number;
    maxExpense?: number;
    assetClasses?: string[];
    dividendRating?: string;
    expensesRating?: string;
    volatilityRating?: string;
    liquidityRating?: string;
    minAssets?: number;
    rsiMode?: string;
    beta?: string;
    isLeveraged?: boolean;
    isInverse?: boolean;
}) => {
    const {
        page = 1,
        limit = 20,
        search,
        sector,
        minYield,
        maxRsi,
        maxExpense,
        assetClasses,
        dividendRating,
        expensesRating,
        volatilityRating,
        liquidityRating,
        minAssets,
        rsiMode,
        beta,
        isLeveraged,
        isInverse
    } = params;

    try {
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    ilike(etfMetadata.symbol, `%${search}%`),
                    ilike(etfMetadata.etf_name, `%${search}%`)
                )
            );
        }

        if (sector && sector !== 'All') {
            const catSubquery = db
                .select({ symbol: etfCategoryMappings.symbol })
                .from(etfCategoryMappings)
                .innerJoin(etfCategories, eq(etfCategoryMappings.category_id, etfCategories.id))
                .where(or(
                    eq(etfCategories.name, sector),
                    eq(etfCategories.slug, sector)
                ));

            conditions.push(
                or(
                    sql`${etfMetadata.symbol} IN (${catSubquery})`,
                    eq(etfMetadata.asset_class, sector),
                    eq(etfMetadata.etf_database_category, sector)
                )
            );
        }

        if (minYield !== undefined && minYield > 0) {
            const threshold = minYield > 1 ? minYield / 100 : minYield;
            conditions.push(gte(etfMetadata.annual_dividend_yield_pct, threshold));
        }

        if (maxRsi !== undefined && maxRsi < 100) {
            conditions.push(lte(etfMetadata.rsi, maxRsi));
        }

        if (maxExpense !== undefined && maxExpense > 0) {
            conditions.push(lte(etfMetadata.expense_ratio, maxExpense / 100));
        }

        if (minAssets !== undefined && minAssets > 0) {
            conditions.push(gte(etfMetadata.total_assets, minAssets));
        }

        if (assetClasses && assetClasses.length > 0) {
            conditions.push(inArray(etfMetadata.asset_class, assetClasses));
        }

        if (dividendRating && dividendRating !== 'All') {
            conditions.push(ilike(etfMetadata.dividend_rating, `${dividendRating}%`));
        }

        if (expensesRating && expensesRating !== 'All') {
            conditions.push(ilike(etfMetadata.expenses_rating, `${expensesRating}%`));
        }

        if (volatilityRating && volatilityRating !== 'All') {
            conditions.push(ilike(etfMetadata.volatility_rating, `${volatilityRating}%`));
        }

        if (liquidityRating && liquidityRating !== 'All') {
            conditions.push(ilike(etfMetadata.liquidity_rating, `${liquidityRating}%`));
        }

        if (isLeveraged !== undefined) {
            conditions.push(eq(etfMetadata.is_leveraged, isLeveraged));
        }

        if (isInverse !== undefined) {
            conditions.push(eq(etfMetadata.is_inverse, isInverse));
        }

        if (rsiMode === 'oversold') {
            conditions.push(lte(etfMetadata.rsi, 35));
        } else if (rsiMode === 'neutral') {
            conditions.push(and(gte(etfMetadata.rsi, 35), lte(etfMetadata.rsi, 65)));
        } else if (rsiMode === 'overbought') {
            conditions.push(gte(etfMetadata.rsi, 65));
        }

        if (beta === 'low') {
            conditions.push(lte(etfMetadata.beta, 0.8));
        } else if (beta === 'moderate') {
            conditions.push(and(gte(etfMetadata.beta, 0.8), lte(etfMetadata.beta, 1.2)));
        } else if (beta === 'high') {
            conditions.push(gte(etfMetadata.beta, 1.2));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (page - 1) * limit;

        const orderClause = search
            ? [
                sql`CASE 
                    WHEN UPPER(${etfMetadata.symbol}) = UPPER(${search}) THEN 0
                    WHEN UPPER(${etfMetadata.symbol}) LIKE UPPER(${search + '%'}) THEN 1
                    ELSE 2 
                END`,
                sql`${etfMetadata.total_assets} DESC NULLS LAST`
              ]
            : [sql`${etfMetadata.total_assets} DESC NULLS LAST`];

        const [etfs, [{ count: totalCount }]] = await Promise.all([
            db
                .select()
                .from(etfMetadata)
                .where(whereClause)
                .orderBy(...orderClause)
                .limit(limit)
                .offset(offset),
            db
                .select({ count: count() })
                .from(etfMetadata)
                .where(whereClause)
        ]);

        const total = Number(totalCount || 0);

        const serializedEtfs = etfs.map(etf => ({
            ...etf,
            sector: (etf.etf_database_category && etf.etf_database_category !== 'NaN')
                ? etf.etf_database_category
                : (etf.asset_class && etf.asset_class !== 'NaN' ? etf.asset_class : 'General'),
        }));

        return {
            etfs: serializedEtfs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error fetching ETFs:', error);
        return { etfs: [], total: 0, page: 1, totalPages: 0 };
    }
}

export const getETFSectors = async () => {
    try {
        const [categories, assetClasses, dbCategories] = await Promise.all([
            db
                .selectDistinct({ name: etfCategories.name })
                .from(etfCategories)
                .innerJoin(etfCategoryMappings, eq(etfCategories.id, etfCategoryMappings.category_id)),
            db
                .selectDistinct({ asset_class: etfMetadata.asset_class })
                .from(etfMetadata)
                .where(isNotNull(etfMetadata.asset_class)),
            db
                .selectDistinct({ cat: etfMetadata.etf_database_category })
                .from(etfMetadata)
                .where(isNotNull(etfMetadata.etf_database_category)),
        ]);

        const uniqueSectors = new Set<string>();
        categories.forEach(c => c.name && uniqueSectors.add(c.name.trim()));
        assetClasses.forEach(a => a.asset_class && a.asset_class !== 'NaN' && uniqueSectors.add(a.asset_class.trim()));
        dbCategories.forEach(d => d.cat && d.cat !== 'NaN' && uniqueSectors.add(d.cat.trim()));

        return Array.from(uniqueSectors).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        console.error('Error fetching ETF sectors:', error);
        return [];
    }
}

export const getStocks = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    minYield?: number;
    minCagr?: number;
    maxPayout?: number;
    maxPe?: number;
    minFcfYield?: number;
    maxRsi?: number;
    maxDe?: number;
    minQuality?: number;
    minMargin?: number;
    beta?: string;
    rsiMode?: string;
}) => {
    const {
        page = 1,
        limit = 10,
        search,
        sector,
        minYield,
        minCagr,
        maxPayout,
        maxPe,
        minFcfYield,
        maxRsi,
        maxDe,
        minQuality,
        minMargin,
        beta,
        rsiMode
    } = params;

    try {
        const conditions = [];

        // Always exclude empty/unpopulated ghost records
        conditions.push(isNotNull(fundamentalScores.name));

        if (search) {
            conditions.push(
                or(
                    ilike(fundamentalScores.ticker, `%${search}%`),
                    ilike(fundamentalScores.name, `%${search}%`)
                )
            );
        }

        if (sector && sector !== 'All') {
            conditions.push(eq(fundamentalScores.sector, sector));
        }

        if (minYield !== undefined && minYield > 0) {
            conditions.push(gte(fundamentalScores.dividend_yield, minYield));
        }

        if (minCagr !== undefined && minCagr > 0) {
            conditions.push(gte(fundamentalScores.dividend_cagr_5y, minCagr));
        }

        if (maxPayout !== undefined && maxPayout < 100) {
            conditions.push(lte(fundamentalScores.payout_ratio, maxPayout));
        }

        if (maxPe !== undefined && maxPe > 0 && maxPe < 200) {
            conditions.push(lte(fundamentalScores.pe_ratio, maxPe));
        }

        if (minFcfYield !== undefined && minFcfYield > 0) {
            conditions.push(gte(fundamentalScores.fcf_yield, minFcfYield));
        }

        if (maxRsi !== undefined && maxRsi < 100) {
            conditions.push(lte(fundamentalScores.rsi, maxRsi));
        }

        if (maxDe !== undefined && maxDe > 0) {
            conditions.push(lte(fundamentalScores.de_ratio, maxDe));
        }

        if (minQuality !== undefined && minQuality > 0) {
            const threshold = minQuality > 1 ? minQuality / 100 : minQuality;
            conditions.push(gte(fundamentalScores.quality_score, threshold));
        }

        if (minMargin !== undefined && minMargin > 0) {
            conditions.push(gte(fundamentalScores.operating_margins, minMargin));
        }

        if (beta === 'low') {
            conditions.push(lte(fundamentalScores.beta, 0.8));
        } else if (beta === 'moderate') {
            conditions.push(and(gte(fundamentalScores.beta, 0.8), lte(fundamentalScores.beta, 1.2)));
        } else if (beta === 'high') {
            conditions.push(gte(fundamentalScores.beta, 1.2));
        }

        if (rsiMode === 'oversold') {
            conditions.push(lte(fundamentalScores.rsi, 35));
        } else if (rsiMode === 'neutral') {
            conditions.push(and(gte(fundamentalScores.rsi, 35), lte(fundamentalScores.rsi, 65)));
        } else if (rsiMode === 'overbought') {
            conditions.push(gte(fundamentalScores.rsi, 65));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (page - 1) * limit;

        const orderClause = search
            ? [
                sql`CASE 
                    WHEN UPPER(${fundamentalScores.ticker}) = UPPER(${search}) THEN 0
                    WHEN UPPER(${fundamentalScores.ticker}) LIKE UPPER(${search + '%'}) THEN 1
                    ELSE 2 
                END`,
                sql`${fundamentalScores.quality_score} DESC NULLS LAST`
              ]
            : [sql`${fundamentalScores.quality_score} DESC NULLS LAST`];

        const [stocks, [{ count: totalCount }]] = await Promise.all([
            db
                .select()
                .from(fundamentalScores)
                .where(whereClause)
                .orderBy(...orderClause)
                .limit(limit)
                .offset(offset),
            db
                .select({ count: count() })
                .from(fundamentalScores)
                .where(whereClause)
        ]);

        const total = Number(totalCount || 0);

        // Convert BigInt to Number for serialization if needed
        const serializedStocks = stocks.map(stock => ({
            ...stock,
            operating_margins: stock.operating_margins ? Number(stock.operating_margins) : null,
            quality_metric: stock.quality_metric ? Number(stock.quality_metric) : null,
        }));

        return {
            stocks: serializedStocks,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Error fetching stocks:', error);
        return { stocks: [], total: 0, page: 1, totalPages: 0 };
    }
}

export const getStocksSectors = async () => {
    try {
        const sectors = await db
            .selectDistinct({ sector: fundamentalScores.sector })
            .from(fundamentalScores)
            .where(isNotNull(fundamentalScores.sector));
        return sectors
            .map(s => s.sector as string)
            .filter(Boolean)
            .sort();
    } catch (error) {
        console.error('Error fetching S&P 500 sectors:', error);
        return [];
    }
}

export const getWatchlist = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return [];

        const userId = Number((session.user as any).id);

        const query = sql`
            WITH RawWatchlist AS (
                SELECT 
                    w.id,
                    w.symbol, 
                    f.sector, 
                    f.current_price as "currentPrice", 
                    f.dividend_yield as "dividendYield",
                    'Stock' as type,
                    w.added_at
                FROM watchlists w 
                JOIN fundamental_scores f ON w.symbol = f.ticker
                WHERE w.owner_id = ${userId}
                
                UNION ALL
                
                SELECT 
                    w.id,
                    w.symbol, 
                    COALESCE(e.asset_class, 'ETF') as sector, 
                    e.previous_closing_price as "currentPrice", 
                    e.annual_dividend_yield_pct/100 as "dividendYield",
                    'ETF' as type,
                    w.added_at
                FROM watchlists w 
                JOIN etf_metadata e ON w.symbol = e.symbol
                WHERE w.owner_id = ${userId}
            )
            SELECT DISTINCT ON (symbol) * 
            FROM RawWatchlist 
            ORDER BY symbol, added_at DESC
        `;

        const { rows } = await db.execute(query);

        const result = (rows as any[]).map(item => ({
            ...item,
            currentPrice: item.currentPrice ? Number(item.currentPrice) : null,
            dividendYield: item.dividendYield ? Number(item.dividendYield) : null,
        })).sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());

        return result;
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return [];
    }
}

export const addToWatchlist = async (symbol: string) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) throw new Error("Unauthorized");

        const userId = Number((session.user as any).id);
        const userName = session.user.name;

        const [asset] = await db
            .insert(watchlists)
            .values({
                symbol: symbol.toUpperCase(),
                owner_id: userId,
                owner_name: userName,
                added_at: new Date()
            })
            .onConflictDoUpdate({
                target: [watchlists.owner_id, watchlists.symbol],
                set: {
                    symbol: symbol.toUpperCase(),
                    owner_name: userName,
                    added_at: new Date()
                }
            })
            .returning();

        return { success: true, asset };
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return { success: false, error: (error as Error).message };
    }
}

export const removeFromWatchlist = async (symbol: string) => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) throw new Error("Unauthorized");

        const userId = Number((session.user as any).id);

        await db
            .delete(watchlists)
            .where(
                and(
                    eq(watchlists.owner_id, userId),
                    eq(watchlists.symbol, symbol)
                )
            );

        return { success: true };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, error: (error as Error).message };
    }
}

export interface ComparisonItem {
    symbol: string;
    name: string;
    type: 'STOCK' | 'ETF';
    sectorOrClass: string;
    price: number | null;
    peRatio: number | null;
    fcfYield: number | null;
    expenseRatio: number | null;
    divYield: number | null;
    divCagr5y: number | null;
    payoutRatio: number | null;
    operatingMargins: number | null;
    roe: number | null;
    deRatio: number | null;
    currentRatio: number | null;
    marketCapOrAssets: number | null;
    numOfHoldings: number | null;
    pctInTop10: number | null;
    rsi: number | null;
    beta: number | null;
    oneDayChange: number | null;
    oneYearPerf: number | null;
    qualityScore: number | null;
    adaptiveScore: number | null;
}

export const getTickerForComparison = async (symbol: string): Promise<ComparisonItem | null> => {
    if (!symbol) return null;
    const cleanSym = symbol.trim().toUpperCase();
    try {
        const stocks = await db
            .select()
            .from(fundamentalScores)
            .where(eq(fundamentalScores.ticker, cleanSym))
            .limit(1);

        if (stocks.length > 0) {
            const stock = stocks[0];
            return {
                symbol: stock.ticker,
                name: stock.name || '',
                type: 'STOCK',
                sectorOrClass: stock.sector || 'Equities',
                price: stock.prev_close ? Number(stock.prev_close) : (stock.current_price ? Number(stock.current_price) : null),
                peRatio: stock.pe_ratio ? Number(stock.pe_ratio) : null,
                fcfYield: stock.fcf_yield ? Number(stock.fcf_yield) : null,
                expenseRatio: null,
                divYield: stock.dividend_yield ? Number(stock.dividend_yield) : null,
                divCagr5y: stock.dividend_cagr_5y ? Number(stock.dividend_cagr_5y) : null,
                payoutRatio: stock.payout_ratio ? Number(stock.payout_ratio) : null,
                operatingMargins: stock.operating_margins ? Number(stock.operating_margins) : null,
                roe: stock.roe ? Number(stock.roe) : null,
                deRatio: stock.de_ratio ? Number(stock.de_ratio) : null,
                currentRatio: stock.current_ratio ? Number(stock.current_ratio) : null,
                marketCapOrAssets: stock.market_cap ? Number(stock.market_cap) : null,
                numOfHoldings: null,
                pctInTop10: null,
                rsi: stock.rsi ? Number(stock.rsi) : null,
                beta: stock.beta ? Number(stock.beta) : null,
                oneDayChange: stock.one_day_change ? Number(stock.one_day_change) : null,
                oneYearPerf: stock.total_return ? Number(stock.total_return) : null,
                qualityScore: stock.quality_score ? Number(stock.quality_score) : null,
                adaptiveScore: stock.adaptive_total_score ? Number(stock.adaptive_total_score) : null,
            };
        }

        const etfs = await db
            .select()
            .from(etfMetadata)
            .where(eq(etfMetadata.symbol, cleanSym))
            .limit(1);

        if (etfs.length > 0) {
            const etf = etfs[0];
            return {
                symbol: etf.symbol,
                name: etf.etf_name || '',
                type: 'ETF',
                sectorOrClass: etf.etf_database_category || etf.asset_class || 'ETF',
                price: etf.previous_closing_price ? Number(etf.previous_closing_price) : null,
                peRatio: etf.pe_ratio ? Number(etf.pe_ratio) : null,
                fcfYield: null,
                expenseRatio: etf.expense_ratio ? Number(etf.expense_ratio) : null,
                divYield: etf.annual_dividend_yield_pct ? Number(etf.annual_dividend_yield_pct) : null,
                divCagr5y: null,
                payoutRatio: null,
                operatingMargins: null,
                roe: null,
                deRatio: null,
                currentRatio: null,
                marketCapOrAssets: etf.total_assets ? Number(etf.total_assets) : null,
                numOfHoldings: etf.num_of_holdings ? Number(etf.num_of_holdings) : null,
                pctInTop10: etf.pct_in_top_10 ? Number(etf.pct_in_top_10) : null,
                rsi: etf.rsi ? Number(etf.rsi) : null,
                beta: etf.beta ? Number(etf.beta) : null,
                oneDayChange: etf.one_day_change ? Number(etf.one_day_change) : null,
                oneYearPerf: etf.one_year_perf ? Number(etf.one_year_perf) : null,
                qualityScore: null,
                adaptiveScore: null,
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching ticker for comparison:", error);
        return null;
    }
};

export const searchTickersForComparison = async (query: string): Promise<{ symbol: string; name: string; type: 'STOCK' | 'ETF'; sector: string }[]> => {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim();

    try {
        const [stocks, etfs] = await Promise.all([
            db
                .select({
                    symbol: fundamentalScores.ticker,
                    name: fundamentalScores.name,
                    sector: fundamentalScores.sector,
                })
                .from(fundamentalScores)
                .where(
                    and(
                        isNotNull(fundamentalScores.name),
                        or(
                            ilike(fundamentalScores.ticker, `%${q}%`),
                            ilike(fundamentalScores.name, `%${q}%`)
                        )
                    )
                )
                .orderBy(
                    sql`CASE 
                        WHEN UPPER(${fundamentalScores.ticker}) = UPPER(${q}) THEN 0 
                        WHEN UPPER(${fundamentalScores.ticker}) LIKE UPPER(${q + '%'}) THEN 1 
                        ELSE 2 
                    END`
                )
                .limit(5),
            db
                .select({
                    symbol: etfMetadata.symbol,
                    name: etfMetadata.etf_name,
                    sector: etfMetadata.asset_class,
                })
                .from(etfMetadata)
                .where(
                    or(
                        ilike(etfMetadata.symbol, `%${q}%`),
                        ilike(etfMetadata.etf_name, `%${q}%`)
                    )
                )
                .orderBy(
                    sql`CASE 
                        WHEN UPPER(${etfMetadata.symbol}) = UPPER(${q}) THEN 0 
                        WHEN UPPER(${etfMetadata.symbol}) LIKE UPPER(${q + '%'}) THEN 1 
                        ELSE 2 
                    END`
                )
                .limit(5),
        ]);

        return [
            ...stocks.map(s => ({ symbol: s.symbol, name: s.name || '', type: 'STOCK' as const, sector: s.sector || '' })),
            ...etfs.map(e => ({ symbol: e.symbol, name: e.name || '', type: 'ETF' as const, sector: e.sector || '' })),
        ];
    } catch (error) {
        console.error("Error searching tickers for comparison:", error);
        return [];
    }
};

