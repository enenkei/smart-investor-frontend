import { NextRequest, NextResponse } from "next/server";

const BASE_MODAL_URL = "https://enenkei--portfolio-architect-web.modal.run/";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        let res = await fetch(BASE_MODAL_URL + "track-performance", {
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
