"use server";

import { db } from "@/lib/db";
import {
    userAssets,
    userPortfolios,
    fundamentalScores,
    etfMetadata,
    tickers,
    watchlists,
} from "@/lib/db/schema";
import { eq, and, or, inArray, desc, asc, ilike } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserAssets() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const userId = (session.user as any).id;
    if (!userId) return [];

    const assets = await db.query.userAssets.findMany({
        where: eq(userAssets.owner_id, parseInt(userId)),
        orderBy: [asc(userAssets.symbol)]
    });

    const uniqueSymbols = Array.from(new Set(assets.map(a => a.symbol.toUpperCase())));

    const scores = uniqueSymbols.length > 0 ? await db.query.fundamentalScores.findMany({
        where: inArray(fundamentalScores.ticker, uniqueSymbols),
        columns: {
            ticker: true,
            current_price: true,
            prev_close: true,
            one_day_change: true,
            price_history: true
        }
    }) : [];

    const scoreMap = new Map(
        scores.map(score => [score.ticker.toUpperCase(), score])
    );

    return assets.map(a => {
        const score = scoreMap.get(a.symbol.toUpperCase());
        return {
            ...a,
            current_price: score?.current_price ?? null,
            prev_close: score?.prev_close ?? null,
            one_day_change: score?.one_day_change ?? null,
            price_history: score?.price_history ?? null
        };
    });
}

export async function getUserPortfolios() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const userId = (session.user as any).id;
    if (!userId) return [];

    const portfolios = await db.query.userPortfolios.findMany({
        where: eq(userPortfolios.owner_id, parseInt(userId)),
        with: { userAssets: true },
        orderBy: [desc(userPortfolios.updated_at)]
    });

    // Gather all unique symbols across all portfolios
    const uniqueSymbols = Array.from(
        new Set(portfolios.flatMap(p => p.userAssets.map(a => a.symbol.toUpperCase())))
    );

    // Fetch pricing and historical metrics from fundamental_scores
    const scores = uniqueSymbols.length > 0 ? await db.query.fundamentalScores.findMany({
        where: inArray(fundamentalScores.ticker, uniqueSymbols),
        columns: {
            ticker: true,
            current_price: true,
            prev_close: true,
            one_day_change: true,
            price_history: true
        }
    }) : [];

    const scoreMap = new Map(
        scores.map(score => [score.ticker.toUpperCase(), score])
    );

    // Map through portfolios and attach columns to user assets
    return portfolios.map(p => ({
        ...p,
        userAssets: p.userAssets.map(a => {
            const score = scoreMap.get(a.symbol.toUpperCase());
            return {
                ...a,
                current_price: score?.current_price ?? null,
                prev_close: score?.prev_close ?? null,
                one_day_change: score?.one_day_change ?? null,
                price_history: score?.price_history ?? null
            };
        })
    }));
}

export async function deleteAsset(symbol: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await db.delete(watchlists).where(
        and(
            eq(watchlists.owner_id, parseInt(userId)),
            eq(watchlists.symbol, symbol)
        )
    );

    revalidatePath("/portfolio");
}

export async function addAsset(symbol: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    const userName = session.user.name || null;

    await db.insert(watchlists).values({
        symbol: symbol.toUpperCase(),
        owner_id: parseInt(userId),
        owner_name: userName,
        added_at: new Date()
    }).onConflictDoUpdate({
        target: [watchlists.owner_id, watchlists.symbol],
        set: {
            symbol: symbol.toUpperCase(),
            owner_name: userName,
            added_at: new Date()
        }
    });

    revalidatePath("/portfolio");
}

export type TickerSearchResult = {
    symbol: string;
    name: string;
    type: 'stock' | 'etf';
};

export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
    if (!query || query.length < 1) return [];

    const q = query.toUpperCase().trim();

    const [stocks, etfs] = await Promise.all([
        db.select({ symbol: tickers.symbol, company_name: tickers.company_name })
            .from(tickers)
            .where(
                or(
                    ilike(tickers.symbol, `%${q}%`),
                    ilike(tickers.company_name, `%${query}%`)
                )
            )
            .limit(10),
        db.select({ symbol: etfMetadata.symbol, etf_name: etfMetadata.etf_name })
            .from(etfMetadata)
            .where(
                or(
                    ilike(etfMetadata.symbol, `%${q}%`),
                    ilike(etfMetadata.etf_name, `%${query}%`)
                )
            )
            .limit(10),
    ]);

    const seen = new Set<string>();
    const results: TickerSearchResult[] = [];

    for (const s of stocks) {
        if (!s.symbol) continue;
        const sym = s.symbol.toUpperCase();
        if (!seen.has(sym)) {
            seen.add(sym);
            results.push({ symbol: sym, name: s.company_name || sym, type: 'stock' });
        }
    }

    for (const e of etfs) {
        if (!e.symbol) continue;
        const sym = e.symbol.toUpperCase();
        if (!seen.has(sym)) {
            seen.add(sym);
            results.push({ symbol: sym, name: e.etf_name, type: 'etf' });
        }
    }

    // Exact symbol matches first, then prefix matches, then rest
    results.sort((a, b) => {
        const rank = (sym: string) => sym === q ? 0 : sym.startsWith(q) ? 1 : 2;
        return rank(a.symbol) - rank(b.symbol);
    });

    return results.slice(0, 8);
}

export type PortfolioCandidate = {
    symbol: string;
    total_return: number;
    beta: number;
    asset_type: 'stock' | 'etf';
    dividend_yield: number;
};

export async function getPortfolioCandidates(tickers: string[]): Promise<PortfolioCandidate[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const userId = (session.user as any).id;
    if (!userId) return [];

    const symbols = tickers;
    if (symbols.length === 0) return [];

    const [fundamentalsList, etfsList] = await Promise.all([
        db.select({
            ticker: fundamentalScores.ticker,
            beta: fundamentalScores.beta,
            total_return: fundamentalScores.total_return,
            dividend_yield: fundamentalScores.dividend_yield
        })
        .from(fundamentalScores)
        .where(inArray(fundamentalScores.ticker, symbols)),

        db.select({
            symbol: etfMetadata.symbol,
            beta: etfMetadata.beta,
            one_year_perf: etfMetadata.one_year_perf,
            annual_dividend_yield_pct: etfMetadata.annual_dividend_yield_pct
        })
        .from(etfMetadata)
        .where(inArray(etfMetadata.symbol, symbols))
    ]);

    const stockMap = new Map(fundamentalsList.map(f => [f.ticker, f]));
    const etfMap = new Map(etfsList.map(e => [e.symbol, e]));

    const candidates: PortfolioCandidate[] = [];
    const seen = new Set<string>();

    for (const symbol of symbols) {
        if (seen.has(symbol)) continue;
        seen.add(symbol);

        if (stockMap.has(symbol)) {
            const f = stockMap.get(symbol)!;
            candidates.push({
                symbol,
                total_return: f.total_return ?? 0,
                beta: f.beta ?? 1,
                asset_type: 'stock',
                dividend_yield: f.dividend_yield ?? 0,
            });
        } else if (etfMap.has(symbol)) {
            const e = etfMap.get(symbol)!;
            candidates.push({
                symbol,
                total_return: e.one_year_perf ?? 0,
                beta: e.beta ?? 1,
                asset_type: 'etf',
                dividend_yield: e.annual_dividend_yield_pct ?? 0,
            });
        }
        // Skip assets with no fundamental data
    }

    return candidates;
}

export type SaveOptimizationInput = {
    tickers: string[];
    shares: Record<string, number>;
    prices: Record<string, number>;
    weights: Record<string, number>;
    projections: any[];
    metrics: any;
    name?: string;
};

export async function saveOptimizationToPortfolio(input: SaveOptimizationInput, portfolio_id: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    const ownerId = parseInt(userId);
    const ownerName = session.user.name || null;

    // 1. Get or create user_portfolio
    let portfolio = null;

    if (portfolio_id !== -1) {
        portfolio = await db.query.userPortfolios.findFirst({
            where: and(
                eq(userPortfolios.owner_id, ownerId),
                ...(portfolio_id > 0 ? [eq(userPortfolios.id, portfolio_id)] : [])
            ),
            orderBy: [desc(userPortfolios.updated_at)]
        });
    } else if (input.name) {
        // Step 2: Check if a portfolio with this name already exists for the user
        portfolio = await db.query.userPortfolios.findFirst({
            where: and(
                eq(userPortfolios.owner_id, ownerId),
                eq(userPortfolios.name, input.name)
            )
        });
    }

    if (portfolio) {
        const [updated] = await db.update(userPortfolios).set({
            name: input.name,
            projections: input.projections as any,
            metrics: input.metrics as any,
            updated_at: new Date(),
        }).where(eq(userPortfolios.id, portfolio.id)).returning();
        portfolio = updated;
    } else {
        const [created] = await db.insert(userPortfolios).values({
            owner_id: ownerId,
            owner_name: ownerName,
            name: input.name,
            projections: input.projections as any,
            metrics: input.metrics as any,
            performance_tracking: {}
        }).returning();
        portfolio = created;
    }

    // 2. Delete existing user_assets for this portfolio
    await db.delete(userAssets).where(eq(userAssets.portfolio_id, portfolio.id));

    // 3. Create new user_assets
    if (input.tickers.length > 0) {
        await Promise.all(
            input.tickers.map((symbol) =>
                db.insert(userAssets).values({
                    symbol,
                    shares: input.shares[symbol] ?? null,
                    avg_cost_basis: input.prices[symbol] ?? null,
                    weight: input.weights[symbol] ?? null,
                    owner_id: ownerId,
                    owner_name: ownerName,
                    portfolio_id: portfolio!.id,
                    updated_at: new Date(),
                })
            )
        );
    }

    revalidatePath("/portfolio");
}

export async function deletePortfolio(id: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await db.delete(userAssets).where(eq(userAssets.portfolio_id, id));

    await db.delete(userPortfolios).where(
        and(
            eq(userPortfolios.id, id),
            eq(userPortfolios.owner_id, parseInt(userId))
        )
    );

    revalidatePath("/portfolio");
}

export async function deleteMultipleWatchlistItems(symbols: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await db.delete(watchlists).where(
        and(
            eq(watchlists.owner_id, parseInt(userId)),
            inArray(watchlists.symbol, symbols)
        )
    );

    revalidatePath("/portfolio");
}

export async function clearWatchlist() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await db.delete(watchlists).where(eq(watchlists.owner_id, parseInt(userId)));

    revalidatePath("/portfolio");
}

export async function savePerformanceResultToPortfolio(portfolioId: number, result: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await db.update(userPortfolios).set({
        annual_return: result.metrics?.portfolio_return_1y ?? null,
        volatility: result.metrics?.portfolio_volatility_1y ?? null,
        sharpe_ratio: result.metrics?.sharpe_ratio ?? null,
        max_drawdown: result.metrics?.max_drawdown ?? null,
        empirical_beta: result.metrics?.empirical_beta ?? null,
        diversification: result.metrics?.diversification_score ?? null,
        rating: result.health?.grade ?? null,
        performance_tracking: result as any
    }).where(
        and(
            eq(userPortfolios.id, portfolioId),
            eq(userPortfolios.owner_id, parseInt(userId))
        )
    );

    revalidatePath("/portfolio");
}
