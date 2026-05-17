'use server'
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getMarketNews = async (page: number = 1, limit: number = 20, ticker?: string) => {
    try {
        let where: any = {};

        if (ticker) {
            // Postgres JSONB containment check
            // Note: This assumes ticker_sentiment is a JSONB array of objects
            where = {
                ticker_sentiment: {
                    array_contains: [{ ticker }]
                }
            };
        }

        const [news, total] = await Promise.all([
            prisma.marketNews.findMany({
                where,
                orderBy: {
                    time_published: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.marketNews.count({ where })
        ]);

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
        const feeds = await prisma.rssFeed.findMany();
        return feeds;
    } catch (error) {
        console.error('Error fetching feeds:', error);
        return [];
    }
}

export const getCommodities = async () => {
    try {
        const commodities = await prisma.commodities.findMany();
        return commodities;
    } catch (error) {
        console.error('Error fetching commodities:', error);
        return [];
    }
}

export const getMarketSentiment = async () => {
    try {
        const news = await prisma.marketNews.findMany({
            select: {
                overall_sentiment_score: true
            },
            orderBy: {
                time_published: 'desc'
            },
            take: 100
        });

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
        const data = await prisma.index_data.findMany({
            where: {
                symbol: {
                    in: symbols
                }
            }
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
            prisma.economicIndicator.findMany(),
            prisma.commodities.findMany()
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
        // 1. Get basic feed status
        const feeds = await prisma.rssFeed.findMany({
            select: {
                id: true,
                name: true,
                url: true,
                is_active: true,
                last_updated: true
            }
        });

        return feeds;
    } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        return [];
    }
}

export const getRSSItems = async (feedId: number) => {
    try {
        const items = await prisma.rssItem.findMany({
            where: {
                feed_id: feedId
            },
            orderBy: {
                published_at: 'desc'
            },
            take: 20
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
        volatilityRating
    } = params;

    try {
        let where: any = {};

        if (search) {
            where.OR = [
                { symbol: { contains: search, mode: 'insensitive' } },
                { etf_name: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (sector && sector !== 'All') {
            where.sector = sector;
        }

        if (minYield !== undefined && minYield > 0) {
            where.annual_dividend_yield_pct = { gte: minYield };
        }

        if (maxRsi !== undefined && maxRsi < 100) {
            where.rsi = { lte: maxRsi };
        }

        if (maxExpense !== undefined) {
            where.expense_ratio = { lte: maxExpense / 100 };
        }

        if (assetClasses && assetClasses.length > 0) {
            where.asset_class = { in: assetClasses };
        }

        if (dividendRating && dividendRating !== 'All') {
            where.dividend_rating = dividendRating;
        }

        if (expensesRating && expensesRating !== 'All') {
            where.expenses_rating = expensesRating;
        }

        if (volatilityRating && volatilityRating !== 'All') {
            where.volatility_rating = volatilityRating;
        }

        const [etfs, total] = await Promise.all([
            prisma.etfMetadata.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    total_assets: 'desc'
                }
            }),
            prisma.etfMetadata.count({ where })
        ]);

        return {
            etfs,
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
        const sectors = await prisma.etfMetadata.findMany({
            select: { sector: true },
            distinct: ['sector'],
            where: { sector: { not: null } }
        });
        return sectors.map(s => s.sector as string).filter(Boolean).sort();
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
        maxRsi
    } = params;

    try {
        let where: any = {};

        if (search) {
            where.OR = [
                { ticker: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (sector && sector !== 'All') {
            where.sector = sector;
        }

        if (minYield !== undefined && minYield > 0) {
            where.dividend_yield = { gte: minYield };
        }

        if (minCagr !== undefined && minCagr > 0) {
            where.dividend_cagr_5y = { gte: minCagr };
        }

        if (maxPayout !== undefined && maxPayout < 100) {
            where.payout_ratio = { lte: maxPayout };
        }

        if (maxPe !== undefined && maxPe < 100) {
            where.pe_ratio = { lte: maxPe };
        }

        if (minFcfYield !== undefined && minFcfYield > 0) {
            where.fcf_yield = { gte: minFcfYield };
        }

        if (maxRsi !== undefined && maxRsi < 100) {
            where.rsi = { lte: maxRsi };
        }

        const [stocks, total] = await Promise.all([
            prisma.fundamentalScores.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    quality_score: 'desc'
                }
            }),
            prisma.fundamentalScores.count({ where })
        ]);

        // Convert BigInt to Number for serialization
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
        const sectors = await prisma.fundamentalScores.findMany({
            select: { sector: true },
            distinct: ['sector'],
            where: { sector: { not: null } }
        });
        return sectors.map(s => s.sector as string).filter(Boolean).sort();
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
        const watchlist = await prisma.$queryRaw`
            WITH RawWatchlist AS (
                SELECT 
                    w.id,
                    w.symbol, 
                    f.sector, 
                    f.current_price as "currentPrice", 
                    f.dividend_yield as "dividendYield",
                    'Stock' as type,
                    w.added_at
                FROM watchlist w 
                JOIN fundamental_scores f ON w.symbol = f.ticker
                WHERE w.owner_id = ${userId}
                
                UNION ALL
                
                SELECT 
                    w.id,
                    w.symbol, 
                    e.sector, 
                    e.previous_closing_price as "currentPrice", 
                    e.annual_dividend_yield_pct as "dividendYield",
                    'ETF' as type,
                    w.added_at
                FROM watchlist w 
                JOIN etf_metadata e ON w.symbol = e.symbol
                WHERE w.owner_id = ${userId}
            )
            SELECT DISTINCT ON (symbol) * 
            FROM RawWatchlist 
            ORDER BY symbol, added_at DESC
        `;
        
        const result = (watchlist as any[]).map(item => ({
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

        const asset = await prisma.watchlist.upsert({
            where: {
                owner_id_symbol: { owner_id: userId, symbol: symbol }
            },
            update: {
                symbol,
                owner_name: userName,
                added_at: new Date()
            },
            create: {
                symbol,
                owner_id: userId,
                owner_name: userName,
            }
        });

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

        await prisma.watchlist.delete({
            where: {
                owner_id_symbol: {
                    owner_id: userId,
                    symbol
                }
            }
        });



        return { success: true };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, error: (error as Error).message };
    }
}
