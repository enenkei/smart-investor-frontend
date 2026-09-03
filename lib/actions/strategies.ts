"use server";

import { db } from "@/lib/db";
import { strategies } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getStrategies() {
  try {
    const result = await db.query.strategies.findMany({
      orderBy: [desc(strategies.updated_at)]
    });
    return result;
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return [];
  }
}
