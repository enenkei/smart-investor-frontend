import { NextRequest, NextResponse } from "next/server";
import { getBaseModalUrl } from "@/controllers/setting-controller";

export async function POST(req: NextRequest) {
    try {
        const baseModalUrl = await getBaseModalUrl();
        const body = await req.json();

        let res = await fetch(baseModalUrl + "calculate-projections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        const data = await res.json();

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        );
    }
}
