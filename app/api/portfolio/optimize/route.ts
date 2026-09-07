import { OptimizedPortfolio } from "@/lib/data-types";
import { NextRequest, NextResponse } from "next/server";
import { getBaseModalUrl } from "@/controllers/setting-controller";

export async function POST(req: NextRequest) {
    try {
        const baseModalUrl = await getBaseModalUrl();
        const body = await req.json();

        const endpoint =
            body.candidates && Array.isArray(body.candidates) && body.candidates.length > 0
                ? "build"
                : "build-from-goal";

        const res = await fetch(baseModalUrl + endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = await res.json();
        const optimizedPortfolio: OptimizedPortfolio = data.optimizedPortfolio || data;

        return NextResponse.json({ optimizedPortfolio, ...data });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
