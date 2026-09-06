"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Terminal } from "lucide-react";
import {
  getApplicationLogs,
  getLogLevelCounts,
  ApplicationLog,
} from "@/controllers/log-controller";
import { toast } from "sonner";

import { LogLevelFilterBadges } from "./log-level-filter-badges";
import { LogFilterControlBar } from "./log-filter-control-bar";
import { LogsTable } from "./logs-table";
import { LogDetailModal } from "./log-detail-modal";
import { TablePaginationFooter } from "./pagination-status-footer";

interface AppLogsViewProps {
  initialLogs: ApplicationLog[];
  initialTotal: number;
  initialTotalPages: number;
  initialCounts: Record<string, number>;
}

export default function AppLogsView({
  initialLogs,
  initialTotal,
  initialTotalPages,
  initialCounts,
}: AppLogsViewProps) {
  const [logs, setLogs] = useState<ApplicationLog[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [level, setLevel] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [selectedLog, setSelectedLog] = useState<ApplicationLog | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [res, countsRes] = await Promise.all([
        getApplicationLogs({
          page,
          limit: pageSize,
          level,
          search,
          sortOrder,
        }),
        getLogLevelCounts(),
      ]);

      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } else {
        toast.error(res.error || "Failed to fetch logs");
      }

      if (countsRes.success) {
        setCounts(countsRes.counts);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading application logs");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, level, search, sortOrder]);

  const isFirstRender = useRef(true);

  // Refetch whenever filters change (skips initial mount since props provide SSR data)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchLogs]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setLevel("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stat Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Application <span className="text-primary">Logs</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time backend worker execution traces, scheduler events, and audit logs.
          </p>
        </div>

        {/* Quick Level Filter Badges */}
        <LogLevelFilterBadges
          level={level}
          onSelectLevel={(lvl) => {
            setLevel(lvl);
            setPage(1);
          }}
          counts={counts}
          total={total}
        />
      </div>

      {/* Filter and Control Bar */}
      <LogFilterControlBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onClearSearch={() => setSearchInput("")}
        level={level}
        onLevelChange={(val) => {
          setLevel(val);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onToggleSortOrder={() =>
          setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
        }
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshIntervalChange={setAutoRefreshInterval}
        onRefresh={fetchLogs}
        loading={loading}
      />

      {/* Logs Table with Pagination Footer */}
      <LogsTable
        logs={logs}
        loading={loading}
        hasFilters={Boolean(search || level !== "ALL")}
        onClearFilters={handleClearFilters}
        onSelectLog={setSelectedLog}
        footer={
          <TablePaginationFooter
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[15, 25, 50, 100]}
            itemName="logs"
            loading={loading}
          />
        }
      />

      {/* Log Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
