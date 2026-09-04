"use server";

import { generateText, Output } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from 'zod';
import { AI_MODEL } from "../lib/data-types";
import { getSystemSetting } from './setting-controller';

export type StockDetail = {
    symbol: string;
    name: string;
    sector: string;
    marketCap: number | null;
    price: number | null;
    oneDayChange: number | null;
    totalReturn: number | null;
    peRatio: number | null;
    fcfYield: number | null;
    operatingMargins: number | null;
    roe: number | null;
    revenueGrowth: number | null;
    epsGrowth5y: number | null;
    deRatio: number | null;
    currentRatio: number | null;
    divYield: number | null;
    divCagr5y: number | null;
    payoutRatio: number | null;
    rsi: number | null;
    beta: number | null;
    qualityScore: number | null;
    growthScore: number | null;
    incomeScore: number | null;
    safetyMetric: number | null;
    adaptiveScore: number | null;
}

export type EtfDetail = {
    symbol: string;
    name: string;
    assetClass: string;
    category: string;
    price: number | null;
    oneDayChange: number | null;
    oneMonthPerf: number | null;
    ytdPriceChange: number | null;
    oneYearPerf: number | null;
    threeYearPerf: number | null;
    fiveYearPerf: number | null;
    expenseRatio: number | null;
    taxForm: string;
    divYield: number | null;
    peRatio: number | null;
    totalAssets: number | null;
    avgVolume: number | null;
    numOfHoldings: number | null;
    pctInTop10: number | null;
    rsi: number | null;
    beta: number | null;
    expensesRating: string | null;
    dividendRating: string | null;
    volatilityRating: string | null;
    liquidityRating: string | null;
    isLeveraged: boolean;
    isInverse: boolean;
}

export const analyzeSelectedStock = async (data: StockDetail) => {
    if (!data) return { error: "No data provided", ok: false };
    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value;
        if (!model) return { error: "AI model not found", ok: false };

        const systemInstruction = `You are a senior quantitative equity research analyst.
Conduct an objective, data-driven analysis of the provided stock metrics.
Analytical Guidelines:
1. Grounding: Every claim must be strictly anchored in the supplied metrics. Quote specific numbers (e.g., P/E, FCF yield, operating margin, D/E, RSI).
2. Valuation & Profitability: Cross-reference P/E against FCF yield, ROE, and Operating Margins. Identify if a low P/E is a value trap or if a premium multiple is earned by high returns on capital.
3. Balance Sheet & Solvency: Evaluate Debt-to-Equity alongside Current Ratio. A D/E > 2.0 with Current Ratio < 1.0 indicates elevated refinancing risk.
4. Dividend Health: If dividend yield > 0, assess payout sustainability (payout ratio < 60% is safe; > 85% is strained; > 100% is at risk of a cut).
5. Technical Context: Assess RSI (oversold < 30, neutral 30-70, overbought > 70) and Beta for market sensitivity.
6. Conciseness: Avoid generic fluff. Make pros, cons, and summary direct and insightful.`;

        const { output } = await generateText({
            model: google(model),
            system: systemInstruction,
            prompt: `Analyze this stock based on the following comprehensive quantitative data:\n${JSON.stringify(data, null, 2)}`,
            output: Output.object({
                schema: z.object({
                    symbol: z.string(),
                    overview: z.string().describe("A concise executive summary synthesizing valuation, profitability, balance sheet resilience, and technical momentum, citing key data points."),
                    pros: z.array(z.string()).describe("2 to 4 concrete, quantified strengths citing numbers from the data (e.g., 'Attractive FCF yield of 6.5% provides high cash conversion')."),
                    cons: z.array(z.string()).describe("2 to 4 concrete, quantified risks or headwinds citing numbers from the data (e.g., 'Elevated D/E ratio of 2.1x paired with weak current ratio of 0.8x signals liquidity risk')."),
                    suitability: z.string().describe("Ideal investor profile and investment strategy (e.g., 'Long-term dividend growth compounders', 'Value turnaround contrarians')."),
                    verdict: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).describe("Final quantitative investment verdict based on holistic data synthesis."),
                    confidenceLevel: z.enum(['High', 'Moderate', 'Low']).describe("Confidence level based on data completeness and consistency of financial signals."),
                    timeHorizon: z.enum(['Short-Term Tactical (< 3 Months)', 'Medium-Term Swing (3-12 Months)', 'Long-Term Buy & Hold (3+ Years)']).describe("Optimal investment horizon for this verdict."),
                    factorGrades: z.object({
                        valuation: z.enum(['Attractive', 'Fair', 'Stretched']).describe("Valuation rating based on P/E, FCF yield, and growth"),
                        financialHealth: z.enum(['Robust', 'Adequate', 'Vulnerable']).describe("Balance sheet rating based on D/E, current ratio, and quality score"),
                        momentum: z.enum(['Oversold', 'Neutral', 'Overbought']).describe("Technical momentum rating based on RSI and performance"),
                    }).describe("Categorical factor scorecard"),
                }),
            }),
            temperature: 0.2
        });
        return { ok: true, data: output };
    } catch (error) {
        console.error("Error analyzing stock:", error);
        return { error: "Error analyzing stock. Please try again later.", ok: false };
    }
}

export const analyzeSelectedEtf = async (data: EtfDetail) => {
    if (!data) return { error: "No data provided", ok: false };
    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value;
        if (!model) return { error: "AI model not found", ok: false };

        const systemInstruction = `You are a senior quantitative ETF analyst.
Conduct an objective, institutional-grade evaluation of the provided Exchange-Traded Fund (ETF) metrics.
Analytical Guidelines:
1. Grounding: Base conclusions strictly on the provided fund data. Quote exact figures (e.g., expense ratio, AUM, concentration in top 10, multi-year returns).
2. Cost & Efficiency: Scrutinize expense ratio (< 0.10% ultra-efficient; > 0.50% high fee drag) and expenses rating.
3. Diversification vs Concentration: Evaluate total holdings count and percentage in top 10. A fund with > 50% in top 10 has significant single-stock idiosyncratic risk.
4. Structural Warnings:
   - If 'isLeveraged' or 'isInverse' is true, strictly flag daily compounding decay and volatility drag—state clearly that it is unsuitable for long-term holding.
   - If 'taxForm' is 'K-1', highlight Schedule K-1 tax filing complexity.
5. Performance & Valuation: Analyze 1Y, 3Y, 5Y annualized performance and underlying basket P/E ratio.
6. Technicals & Liquidity: Assess RSI, Beta, Total Assets (AUM), and Average Daily Volume for trading liquidity.`;

        const { output } = await generateText({
            model: google(model),
            system: systemInstruction,
            prompt: `Analyze this ETF based on the following comprehensive quantitative fund data:\n${JSON.stringify(data, null, 2)}`,
            output: Output.object({
                schema: z.object({
                    symbol: z.string(),
                    overview: z.string().describe("A concise executive summary synthesizing the fund's objective, fee efficiency, diversification, performance, and current technical momentum."),
                    pros: z.array(z.string()).describe("2 to 4 concrete, quantified fund advantages citing numbers (e.g., 'Ultra-low expense ratio of 0.03% preserves long-term compounding')."),
                    cons: z.array(z.string()).describe("2 to 4 concrete, quantified risks or drawbacks citing numbers (e.g., 'Heavy concentration with 54% of assets in top 10 holdings elevates single-stock risk')."),
                    suitability: z.string().describe("Ideal investor profile and portfolio role (e.g., 'Core portfolio foundation for passive indexers', 'Tactical sector tilt for momentum traders')."),
                    verdict: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).describe("Final quantitative investment verdict based on holistic fund metrics."),
                    confidenceLevel: z.enum(['High', 'Moderate', 'Low']).describe("Confidence level based on fund data completeness and clarity of signals."),
                    timeHorizon: z.enum(['Short-Term Tactical (< 3 Months)', 'Medium-Term Swing (3-12 Months)', 'Long-Term Buy & Hold (3+ Years)']).describe("Optimal investment horizon for this verdict."),
                    factorGrades: z.object({
                        feeEfficiency: z.enum(['Ultra-Low Cost', 'Moderate Fee', 'High Expense']).describe("Fee efficiency based on expense ratio and peer rating"),
                        diversification: z.enum(['Broad / Well-Diversified', 'Moderate Concentration', 'Highly Concentrated / Top-Heavy']).describe("Diversification rating based on holdings count and top 10 %"),
                        momentum: z.enum(['Oversold', 'Neutral', 'Overbought']).describe("Technical momentum rating based on RSI and recent performance"),
                    }).describe("Categorical factor scorecard"),
                }),
            }),
            temperature: 0.2
        });
        return { ok: true, data: output };
    } catch (error) {
        console.error("Error analyzing ETF:", error);
        return { error: "Error analyzing ETF. Please try again later.", ok: false };
    }
}

export type InvestmentGoal = 'Long-Term Compounding' | 'High Dividend Income' | 'Defensive & Capital Preservation' | 'Aggressive Growth';

export interface ComparisonDuelParams {
    tickerA: import('./stock-data-controller').ComparisonItem;
    tickerB: import('./stock-data-controller').ComparisonItem;
    investmentGoal?: InvestmentGoal;
}

export const compareTickersHeadToHead = async (params: ComparisonDuelParams) => {
    const { tickerA, tickerB, investmentGoal = 'Long-Term Compounding' } = params;
    if (!tickerA || !tickerB) return { error: "Both tickers are required for comparison", ok: false };

    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value;
        if (!model) return { error: "AI model not found", ok: false };

        const systemInstruction = `You are an elite institutional portfolio manager and head of the investment committee.
Conduct an exhaustive, quantitative head-to-head comparison ("Duel") between two financial assets: Asset A (${tickerA.symbol}) and Asset B (${tickerB.symbol}).
The investor's stated objective is: "${investmentGoal}".

Analytical Directives:
1. Grounding & Precision: Directly compare numbers against numbers (e.g., compare P/E, FCF yield, dividend yield, 5-year dividend CAGR, operating margins, leverage, and fees).
2. Goal Alignment: Judge the winner strictly through the lens of "${investmentGoal}". For example:
   - For "Long-Term Compounding": Prioritize high ROE, pricing power, durable FCF conversion, dividend growth CAGR, and low expense ratios.
   - For "High Dividend Income": Prioritize sustainable yield, safe payout ratios (<80%), and income stability.
   - For "Defensive & Capital Preservation": Prioritize low Beta, low Debt/Equity, high current ratio, and low drawdown risk.
   - For "Aggressive Growth": Prioritize revenue growth, momentum, and operating leverage.
3. Unbiased Winner: Declare either "${tickerA.symbol}", "${tickerB.symbol}", or "Tie / Complementary" if both serve distinct complementary roles in a core-satellite portfolio.
4. Actionable Allocation: Give a concrete portfolio recommendation (e.g., "Allocate 70% to ${tickerA.symbol} and 30% to ${tickerB.symbol} as a tactical tilt").`;

        const prompt = `Compare these two assets for the objective "${investmentGoal}":
Asset A (${tickerA.symbol}): ${JSON.stringify(tickerA, null, 2)}
Asset B (${tickerB.symbol}): ${JSON.stringify(tickerB, null, 2)}`;

        const { output } = await generateText({
            model: google(model),
            system: systemInstruction,
            prompt,
            output: Output.object({
                schema: z.object({
                    winner: z.string().describe(`The winning symbol (${tickerA.symbol} or ${tickerB.symbol}) or 'Tie / Complementary'`),
                    confidenceLevel: z.enum(['High', 'Moderate', 'Low']).describe("Confidence in this comparative ruling"),
                    executiveSummary: z.string().describe("Concise 2-3 sentence verdict explaining why the winner prevailed for this investment goal, citing key comparative metrics."),
                    advantagesA: z.array(z.string()).describe(`Key advantages of ${tickerA.symbol} over ${tickerB.symbol} with exact numbers`),
                    advantagesB: z.array(z.string()).describe(`Key advantages of ${tickerB.symbol} over ${tickerA.symbol} with exact numbers`),
                    keyTradeoff: z.string().describe("The primary risk or sacrifice the investor must accept when picking one over the other."),
                    portfolioRecommendation: z.string().describe("Actionable allocation guidance (e.g., percentage split, replacement recommendation, or core-satellite structure)."),
                    winnerMetricsHighlight: z.array(z.string()).describe("List of 2-3 decisive metrics that tilted the decision (e.g., 'FCF Yield 7.1% vs 3.2%', 'Expense ratio 0.06% vs 0.35%')"),
                }),
            }),
            temperature: 0.2
        });

        return { ok: true, data: output };
    } catch (error) {
        console.error("Error comparing tickers:", error);
        return { error: "Error comparing tickers. Please try again later.", ok: false };
    }
};

export interface EtfAuditInput {
    symbol: string;
    name: string;
    weight: number;
    expenseRatio: number | null;
    numOfHoldings: number | null;
    pctInTop10: number | null;
    peRatio: number | null;
    annualDividendYield: number | null;
    category: string;
    assetClass: string;
}

export const auditEtfOverlapAndConcentration = async (etfs: EtfAuditInput[]) => {
    if (!etfs || etfs.length < 2) return { error: "Please select at least 2 ETFs for an overlap audit", ok: false };

    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value;
        if (!model) return { error: "AI model not found", ok: false };

        const systemInstruction = `You are a chief investment strategist and quantitative ETF risk architect.
Conduct an authoritative Overlap & Concentration Audit on the provided portfolio basket of Exchange-Traded Funds (ETFs).

Analytical Directives:
1. True Overlap Estimation:
   - Use your comprehensive knowledge of index constituents, weighting methodologies, and holdings across major US ETFs (e.g. S&P 500, Total US Market, Nasdaq 100, Dividend indices, Thematic, International, Sector ETFs).
   - Estimate the weighted portfolio overlap percentage (0% to 100%).
   - Highlight exact duplications (e.g. VOO vs SPY = 100%; VOO vs VTI = ~85%; VOO vs QQQ = ~45%).
2. Consolidated Underlying Stock Exposure:
   - Calculate the estimated true weight of the top 6-8 underlying stocks across the whole portfolio, weighted by user allocations.
   - Specifically note the aggregate concentration in the "Magnificent 7" / Mega-Cap Tech stocks.
3. Redundancy & Fee Drag:
   - Highlight any redundant holdings where the investor is paying higher expense ratios for overlapping exposure.
4. Actionable Consolidation Strategy:
   - Give 2-4 concrete, high-impact recommendations (e.g., "Consolidate X into Y to save fees", "Add non-correlated asset class like Small-Cap Value or International to reduce mega-cap tech tilt").`;

        const prompt = `Perform an institutional Overlap & Concentration Audit on this ETF basket:
${JSON.stringify(etfs, null, 2)}`;

        const { output } = await generateText({
            model: google(model),
            system: systemInstruction,
            prompt,
            output: Output.object({
                schema: z.object({
                    overlapScore: z.enum(['Low Overlap (Well-Diversified)', 'Moderate Overlap', 'High Overlap (Significant Redundancy)', 'Extreme Duplication']),
                    estimatedOverlapPct: z.number().describe("Estimated percentage overlap across the combined funds (0-100)"),
                    diversificationGrade: z.enum(['A (Excellent)', 'B (Good)', 'C (Mediocre / Overlapping)', 'D (Illusion of Diversification)', 'F (Heavily Duplicated)']),
                    top10AggregateConcentrationPct: z.number().describe("Estimated combined weight of the top 10 individual stocks in the entire portfolio (0-100)"),
                    topConsolidatedHoldings: z.array(
                        z.object({
                            ticker: z.string(),
                            companyName: z.string(),
                            estimatedWeightPct: z.number().describe("Combined portfolio weight percentage"),
                            contributingEtfs: z.array(z.string()).describe("Which ETFs contribute to this holding"),
                        })
                    ).describe("Top 6-8 consolidated stock positions across all selected funds"),
                    executiveAuditSummary: z.string().describe("Concise 3-4 sentence diagnostic summary explaining whether this basket provides true diversification or is a duplication trap."),
                    redundancyWarnings: z.array(z.string()).describe("2-3 specific warnings regarding duplicate index exposure, fee drag, or correlated volatility"),
                    consolidationRecommendations: z.array(z.string()).describe("2-4 concrete portfolio adjustments to reduce overlap and optimize risk-adjusted returns"),
                }),
            }),
            temperature: 0.2
        });

        return { ok: true, data: output };
    } catch (error) {
        console.error("Error auditing ETF overlap:", error);
        return { error: "Error auditing ETF overlap. Please try again later.", ok: false };
    }
};

export interface SnowballSimulationParams {
    tickerSymbol?: string;
    startingPrincipal: number;
    monthlyContribution: number;
    initialYieldPct: number;
    annualDivGrowthPct: number;
    annualAppreciationPct: number;
    years: number;
    dripEnabled: boolean;
    targetMonthlyIncome: number;
    finalPortfolioValue: number;
    finalAnnualDividends: number;
    finalMonthlyDividends: number;
    crossoverYear: number | null;
    yieldOnCostPct: number;
    totalContributed: number;
    totalDividendsEarned: number;
}

export const analyzeDividendSnowball = async (params: SnowballSimulationParams) => {
    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value;
        if (!model) return { error: "AI model not found", ok: false };

        const systemInstruction = `You are an expert dividend growth compounding strategist and financial independence coach.
Analyze the user's dividend snowball simulation projection.

Analytical Directives:
1. Target Assessment: Compare their final projected monthly dividend income ($${params.finalMonthlyDividends.toFixed(0)}/mo) with their target monthly income goal ($${params.targetMonthlyIncome.toFixed(0)}/mo).
2. The Crossover Point: The crossover point is when annual dividends exceed annual out-of-pocket contributions. Explain the compounding significance of this milestone (${params.crossoverYear ? `Year ${params.crossoverYear}` : 'Not reached within horizon'}).
3. DRIP Impact: Highlight the compounding power of dividend reinvestment versus cashing out.
4. Acceleration Levers: Give 2-3 specific, realistic tweaks to reach the target faster (e.g., small monthly savings increases, dividend reinvestment discipline).
5. Longevity & Inflation Reality: Explain how dividend growth CAGR protects purchasing power against inflation compared to fixed income.`;

        const prompt = `Review this dividend compounding projection:
${JSON.stringify(params, null, 2)}`;

        const { output } = await generateText({
            model: google(model),
            system: systemInstruction,
            prompt,
            output: Output.object({
                schema: z.object({
                    status: z.enum(['Goal Achieved Ahead of Time', 'Goal On Track', 'Modest Shortfall', 'Significant Gap']),
                    executiveSummary: z.string().describe("Concise 2-3 sentence financial coaching overview evaluating their timeline and income trajectory."),
                    crossoverMilestoneInsight: z.string().describe("Insight on the crossover point where compounding takes over out-of-pocket savings."),
                    accelerationLevers: z.array(z.string()).describe("2-3 high-impact strategic actions to hit their monthly passive income goal faster"),
                    inflationDefenseNote: z.string().describe("Brief note explaining how dividend growth protects future purchasing power"),
                }),
            }),
            temperature: 0.2
        });

        return { ok: true, data: output };
    } catch (error) {
        console.error("Error analyzing dividend snowball:", error);
        return { error: "Error analyzing dividend snowball. Please try again later.", ok: false };
    }
};