'use server';

import { db } from "@/lib/db";
import { applicationLogs } from "@/lib/db/schema";
import { and, desc, asc, eq, sql, count } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

export type ApplicationLog = InferSelectModel<typeof applicationLogs>;

export interface LogFilterParams {
  page?: number;
  limit?: number;
  level?: string;
  search?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetLogsResponse {
  success: boolean;
  logs: ApplicationLog[];
  total: number;
  totalPages: number;
  page: number;
  error?: string;
}

export async function getApplicationLogs(params: LogFilterParams = {}): Promise<GetLogsResponse> {
  try {
    const {
      page = 1,
      limit = 25,
      level = 'ALL',
      search = '',
      sortOrder = 'desc',
    } = params;

    const conditions = [];

    if (level && level !== 'ALL') {
      conditions.push(eq(applicationLogs.level, level.toUpperCase()));
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        sql`(${applicationLogs.message} ILIKE ${searchTerm} OR ${applicationLogs.logger} ILIKE ${searchTerm})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const safeLimit = Math.max(1, Math.min(100, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const [logs, [{ count: totalCount }]] = await Promise.all([
      db
        .select()
        .from(applicationLogs)
        .where(whereClause)
        .orderBy(sortOrder === 'asc' ? asc(applicationLogs.timestamp) : desc(applicationLogs.timestamp))
        .limit(safeLimit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(applicationLogs)
        .where(whereClause),
    ]);

    const total = Number(totalCount || 0);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      success: true,
      logs,
      total,
      totalPages,
      page: safePage,
    };
  } catch (error: any) {
    console.error("Error fetching application logs:", error);
    return {
      success: false,
      logs: [],
      total: 0,
      totalPages: 1,
      page: 1,
      error: error.message || "Failed to fetch application logs",
    };
  }
}

export async function getLogLevelCounts() {
  try {
    const counts = await db
      .select({
        level: applicationLogs.level,
        count: count(),
      })
      .from(applicationLogs)
      .groupBy(applicationLogs.level);

    const levelCounts: Record<string, number> = {
      TOTAL: 0,
    };

    let total = 0;
    for (const item of counts) {
      const c = Number(item.count || 0);
      const lvl = (item.level || 'UNKNOWN').toUpperCase();
      levelCounts[lvl] = c;
      total += c;
    }
    levelCounts.TOTAL = total;

    return {
      success: true,
      counts: levelCounts,
    };
  } catch (error: any) {
    console.error("Error fetching log level counts:", error);
    return {
      success: false,
      counts: { TOTAL: 0 },
    };
  }
}
