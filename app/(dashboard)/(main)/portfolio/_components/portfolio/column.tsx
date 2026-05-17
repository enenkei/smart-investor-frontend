"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Asset = {
    symbol: string,
    shares: number | null,
    avg_cost_basis: number | null,
    weight: number | null,
    owner_id: number,
    portfolio_id: number,
    owner_name: string | null,
    updated_at: Date
}

export const columns: ColumnDef<Asset>[] = [
    {
        accessorKey: "symbol",
        header: "Symbol",
    },
    {
        accessorKey: "shares",
        header: "Shares",
    },
    {
        accessorKey: "avg_cost_basis",
        header: () => <div className="text-right">Avg Cost Basis</div>,
        cell: ({ row }) => {
            const val = row.getValue("avg_cost_basis") as number | null
            if (val === null) return <div className="text-right font-medium">-</div>
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(val)

            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => {
            const val = row.getValue("weight") as number | null
            if (val === null) return "-";
            return <span className="font-medium text-primary text-right">{(val * 100).toFixed(2)}%</span>
        }
    },
    {
        accessorKey: "updated_at",
        header: "Optimized Date",
        cell: ({ row }) => {
            const val = row.getValue("updated_at") as Date | null
            if (val === null) return "-";
            return <span>{format(val, "yyyy/MM/dd")}</span>
        }
    },
]