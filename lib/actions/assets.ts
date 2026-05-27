"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserAssets() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const userId = (session.user as any).id;
    if (!userId) return [];

    return await prisma.user_assets.findMany({
        where: { owner_id: parseInt(userId) },
        orderBy: { symbol: 'asc' }
    });
}

export async function getUserPortfolios() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];
    const userId = (session.user as any).id;
    if (!userId) return [];

    return await prisma.user_portfolio.findMany({
        where: { owner_id: parseInt(userId) },
        include: { userAssets: true },
        orderBy: { updated_at: 'desc' }
    });
}

// export async function updateAssetDetails(symbol: string, data: { shares_count?: number, avg_cost_basis?: number }) {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) throw new Error("Unauthorized");
//     const userId = (session.user as any).id;
//     if (!userId) throw new Error("Unauthorized");

//     await prisma.user_assets.update({
//         where: { symbol },
//         data: {
//             shares: data.shares_count,
//             avg_cost_basis: data.avg_cost_basis
//         }
//     });

//     revalidatePath("/portfolio");
// }

export async function deleteAsset(symbol: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.watchlist.delete({
        where: { owner_id_symbol: { owner_id: parseInt(userId), symbol: symbol } }
    });

    revalidatePath("/portfolio");
}

export async function addAsset(symbol: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    const userName = session.user.name || null;

    await prisma.watchlist.upsert({
        where: {
            owner_id_symbol: { owner_id: parseInt(userId), symbol: symbol }
        },
        update: {
            symbol: symbol.toUpperCase(),
            owner_name: userName,
            added_at: new Date()
        },
        create: {
            symbol: symbol.toUpperCase(),
            owner_id: parseInt(userId),
            owner_name: userName
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
        prisma.tickers.findMany({
            where: {
                OR: [
                    { symbol: { contains: q, mode: 'insensitive' } },
                    { company_name: { contains: query, mode: 'insensitive' } },
                ]
            },
            select: { symbol: true, company_name: true },
            take: 10,
        }),
        prisma.etfMetadata.findMany({
            where: {
                OR: [
                    { symbol: { contains: q, mode: 'insensitive' } },
                    { etf_name: { contains: query, mode: 'insensitive' } },
                ]
            },
            select: { symbol: true, etf_name: true },
            take: 10,
            distinct: ['symbol'],
        }),
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

    // const userAssets = await prisma.user_assets.findMany({
    //     where: { owner_id: parseInt(userId), symbol: { in: tickers } },
    //     select: { symbol: true },
    // });
    // console.log(userAssets)
    // if (userAssets.length === 0) return [];

    // const symbols = userAssets.map(a => a.symbol);

    const symbols = tickers;

    const [fundamentals, etfs] = await Promise.all([
        prisma.fundamentalScores.findMany({
            where: { ticker: { in: symbols } },
            select: { ticker: true, beta: true, total_return: true, dividend_yield: true },
        }),
        prisma.etfMetadata.findMany({
            where: { symbol: { in: symbols } },
            select: { symbol: true, beta: true, one_year_perf: true, annual_dividend_yield_pct: true },
            distinct: ['symbol'],
        }),
    ]);

    const stockMap = new Map(fundamentals.map(f => [f.ticker, f]));
    const etfMap = new Map(etfs.map(e => [e.symbol!, e]));

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
        portfolio = await prisma.user_portfolio.findFirst({
            where: {
                owner_id: ownerId,
                ...(portfolio_id > 0 ? { id: portfolio_id } : {})
            },
            orderBy: { updated_at: 'desc' }
        });
    } else if (input.name) {
        // Step 2: Check if a portfolio with this name already exists for the user
        portfolio = await prisma.user_portfolio.findFirst({
            where: {
                owner_id: ownerId,
                name: input.name
            }
        });
    }


    if (portfolio) {
        portfolio = await prisma.user_portfolio.update({
            where: { id: portfolio.id },
            data: {
                name: input.name,
                projections: input.projections as any,
                metrics: input.metrics as any,
                updated_at: new Date(),
            },
        });
    } else {
        portfolio = await prisma.user_portfolio.create({
            data: {
                owner_id: ownerId,
                owner_name: ownerName,
                name: input.name,
                projections: input.projections as any,
                metrics: input.metrics as any,
                performance_tracking: {}
            },
        });
    }

    // 2. Delete existing user_assets for this portfolio
    await prisma.user_assets.deleteMany({
        where: { portfolio_id: portfolio.id }
    });

    // 3. Create new user_assets
    // Note: We use upsert here because symbol is currently the primary key in the schema,
    // and this handles potential collisions if a symbol wasn't properly cleaned up.
    await Promise.all(
        input.tickers.map((symbol) =>
            prisma.user_assets.upsert({
                where: {
                    owner_id_portfolio_id_symbol: {
                        owner_id: ownerId,
                        portfolio_id: portfolio!.id,
                        symbol
                    }
                },

                update: {
                    shares: input.shares[symbol] ?? null,
                    avg_cost_basis: input.prices[symbol] ?? null,
                    weight: input.weights[symbol] ?? null,
                    owner_id: ownerId,
                    owner_name: ownerName,
                    portfolio_id: portfolio!.id
                },
                create: {
                    symbol,
                    shares: input.shares[symbol] ?? null,
                    avg_cost_basis: input.prices[symbol] ?? null,
                    weight: input.weights[symbol] ?? null,
                    owner_id: ownerId,
                    owner_name: ownerName,
                    portfolio_id: portfolio!.id
                }
            })
        )
    );

    revalidatePath("/portfolio");
}

export async function deletePortfolio(id: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.user_assets.deleteMany({
        where: { portfolio_id: id }
    });

    await prisma.user_portfolio.delete({
        where: { id: id, owner_id: parseInt(userId) }
    });

    revalidatePath("/portfolio");
}

export async function deleteMultipleWatchlistItems(symbols: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.watchlist.deleteMany({
        where: {
            owner_id: parseInt(userId),
            symbol: { in: symbols }
        }
    });

    revalidatePath("/portfolio");
}

export async function clearWatchlist() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.watchlist.deleteMany({
        where: { owner_id: parseInt(userId) }
    });

    revalidatePath("/portfolio");
}

export async function savePerformanceResultToPortfolio(portfolioId: number, result: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;
    if (!userId) throw new Error("Unauthorized");

    // @ts-ignore
    await prisma.user_portfolio.update({
        where: { id: portfolioId, owner_id: parseInt(userId) },
        data: {
            annual_return: result.metrics.portfolio_return_1y ?? null,
            volatility: result.metrics.portfolio_volatility_1y ?? null,
            sharpe_ratio: result.metrics.sharpe_ratio ?? null,
            max_drawdown: result.metrics.max_drawdown ?? null,
            empirical_beta: result.metrics.empirical_beta ?? null,
            diversification: result.metrics.diversification_score ?? null,
            rating: result.health.grade ?? null,
            performance_tracking: result as any
        }
    });

    revalidatePath("/portfolio");
}
