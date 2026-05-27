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
    price: number | null;
    adaptiveScore: number | null;
    qualityScore: number | null;
    divYield: number | null;
    divCagr5y: number | null;
    payoutRatio: number | null;
    peRatio: number | null;
    fcfYield: number | null;
    deRatio: number | null;
    rsi: number | null;
    totalReturn: number | null;
    epsGrowth5y: number | null;
    beta: number | null;
}

export type EtfDetail = {
    symbol: string;
    name: string;
    assetClass: string;
    sector: string;
    expenseRatio: number | null;
    taxForm: string;
    divYield: number | null;
    totalAssets: number | null;
    avgVolume: number | null;
    rsi: number | null;
    ytdPriceChange: number | null;
    oneMonthPerf: number | null;
    beta: number | null;
    isLeveraged: boolean;
    isInverse: boolean;
}

export const analyzeSelectedStock = async (data: StockDetail) => {
    if (!data) return { error: "No data provided", ok: false };
    try {
        const modelResult = await getSystemSetting(AI_MODEL);
        const model = modelResult?.value || "gemini-3.1-flash-lite";
        const { output } = await generateText({
            model: google(model),
            prompt: `You are an expert quantitative equity analyst. Analyze this stock based on the provided metrics: ${JSON.stringify(data)}`,
            output: Output.object({
                schema: z.object({
                    symbol: z.string(),
                    overview: z.string().describe("A brief, punchy overview of this stock's valuation, momentum, and quality."),
                    pros: z.array(z.string()).describe("A list of 2-3 specific pros (e.g., 'Strong FCF yield of 8% provides a margin of safety')."),
                    cons: z.array(z.string()).describe("A list of 2-3 specific cons or risks (e.g., 'High Debt-to-Equity ratio of 2.5 indicates leverage risk')."),
                    suitability: z.string().describe("What type of investor is this stock best suited for? (e.g., 'Value investors looking for turnaround opportunities')"),
                    verdict: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).describe("The final investment verdict based purely on the provided data metrics."),
                    confidenceLevel: z.string().describe("Confidence level of the suggestion"),
                }),
            }),
            temperature: 0.7
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
        const model = modelResult?.value || "gemini-3.1-flash-lite";
        const { output } = await generateText({
            model: google(model),
            prompt: `You are an expert quantitative analyst. Analyze this ETF based on the provided metrics: ${JSON.stringify(data)}`,
            output: Output.object({
                schema: z.object({
                    symbol: z.string(),
                    overview: z.string().describe("A brief, punchy overview of this ETF's objective, market positioning, and recent performance."),
                    pros: z.array(z.string()).describe("A list of 2-3 specific pros (e.g., 'Low expense ratio of 0.05% preserves capital')."),
                    cons: z.array(z.string()).describe("A list of 2-3 specific cons or risks (e.g., 'High RSI of 75 indicates it may be overbought')."),
                    suitability: z.string().describe("What type of investor is this ETF best suited for? (e.g., 'Income seekers with a long-term horizon')"),
                    verdict: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).describe("The final investment verdict based purely on the provided data metrics."),
                    confidenceLevel: z.string().describe("Confidence level of the suggestion"),
                }),
            }),
            temperature: 0.7
        });
        return { ok: true, data: output };
    } catch (error) {
        console.error("Error analyzing ETF:", error);
        return { error: "Error analyzing ETF. Please try again later.", ok: false };
    }
}