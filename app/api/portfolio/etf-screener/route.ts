import { NextResponse } from "next/server";

const BASE_MODAL_URL = "https://enenkei--portfolio-architect-web.modal.run/";

// Self-contained high-performance in-memory cache layer
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes duration

export async function GET() {
    try {
        const now = Date.now();
        
        // Return instantly if cache is fresh
        if (cachedData && (now - cacheTime) < CACHE_TTL) {
            return NextResponse.json(cachedData);
        }

        let res = await fetch(BASE_MODAL_URL + "etf-screener", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = await res.json();

        // Update cache state
        cachedData = data;
        cacheTime = now;

        return NextResponse.json(data);
    } catch (err: any) {
        // Graceful stale-while-revalidate fallback if service is down/rate-limited
        if (cachedData) {
            console.warn("Serving stale ETF discovery cache on backend error:", err.message);
            return NextResponse.json(cachedData);
        }
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
