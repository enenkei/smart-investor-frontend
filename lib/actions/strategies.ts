"use server";

import { prisma } from "@/lib/prisma";

export async function getStrategies() {
  try {
    const strategies = await prisma.strategies.findMany({
      orderBy: {
        updated_at: 'desc'
      }
    });
    return strategies;
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return [];
  }
}
