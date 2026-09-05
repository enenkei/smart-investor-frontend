"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Filter,
  ArrowUpDown,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  getApplicationLogs,
  getLogLevelCounts,
  ApplicationLog,
} from "@/controllers/log-controller";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  const handleCopy = async (text: string, id?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id != null) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      toast.success("Log message copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy log message");
    }
  };

  const getLevelBadge = (lvl: string) => {
    const upper = lvl.toUpperCase();
    let color = "bg-muted text-muted-foreground border-border";
    let Icon = Info;

    if (upper === "ERROR" || upper === "CRITICAL") {
      color = "bg-rose-500/10 text-rose-500 border-rose-500/30";
      Icon = AlertCircle;
    } else if (upper === "WARNING" || upper === "WARN") {
      color = "bg-amber-500/10 text-amber-500 border-amber-500/30";
      Icon = AlertTriangle;
    } else if (upper === "INFO") {
      color = "bg-sky-500/10 text-sky-500 border-sky-500/30";
      Icon = Info;
    } else if (upper === "DEBUG") {
      color = "bg-purple-500/10 text-purple-500 border-purple-500/30";
      Icon = Terminal;
    }

    return (
      <Badge
        variant="outline"
        className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border gap-1", color)}
      >
        <Icon className="w-3 h-3" />
        {upper}
      </Badge>
    );
  };

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setLevel("ALL");
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
              level === "ALL"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card/40 border-border/60 hover:bg-muted text-muted-foreground"
            )}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80 font-mono">({counts.TOTAL ?? total})</span>
          </button>

          {counts.ERROR != null && (
            <button
              onClick={() => {
                setLevel("ERROR");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
                level === "ERROR"
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                  : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 text-rose-500"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Errors</span>
              <span className="text-[10px] font-mono">({counts.ERROR})</span>
            </button>
          )}

          {counts.WARNING != null && (
            <button
              onClick={() => {
                setLevel("WARNING");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
                level === "WARNING"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 text-amber-500"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warnings</span>
              <span className="text-[10px] font-mono">({counts.WARNING})</span>
            </button>
          )}

          {counts.INFO != null && (
            <button
              onClick={() => {
                setLevel("INFO");
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer flex items-center gap-2",
                level === "INFO"
                  ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                  : "bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10 text-sky-500"
              )}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info</span>
              <span className="text-[10px] font-mono">({counts.INFO})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card/20 p-4 border border-border/50 rounded-none backdrop-blur-sm shadow-sm">
        {/* Left: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search log message or logger..."
              className="pl-9 pr-8 bg-background/60 border-border/40 h-9 text-xs rounded-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-none transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select
              value={level}
              onValueChange={(val) => {
                setLevel(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[150px] bg-background/60 border-border/40 h-9 text-xs rounded-none">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-none bg-background/60 w-full sm:w-auto"
            title={`Sort Order: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </Button>
        </div>

        {/* Right: Refresh & Page Size */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Auto Refresh Select */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline">Auto-refresh:</span>
            <Select
              value={autoRefreshInterval.toString()}
              onValueChange={(val) => setAutoRefreshInterval(Number(val))}
            >
              <SelectTrigger className="w-[100px] bg-background/60 border-border/40 h-9 text-xs rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="5">5s</SelectItem>
                <SelectItem value="15">15s</SelectItem>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">60s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-9 px-3 gap-1.5 text-xs rounded-none bg-background/60 border-border/40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-border/50 bg-card/10 backdrop-blur-sm overflow-hidden rounded-none shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[180px] h-9 py-0 border-r border-border/10">
                  Timestamp
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[120px] h-9 py-0 border-r border-border/10">
                  Level
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[220px] h-9 py-0 border-r border-border/10">
                  Logger
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground h-9 py-0 border-r border-border/10">
                  Message
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black tracking-widest text-muted-foreground w-[90px] h-9 py-0 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && logs.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border/10 h-11">
                    <TableCell colSpan={5}>
                      <div className="h-3 bg-muted/20 w-full rounded-none" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Terminal className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-semibold">No application logs found</p>
                      <p className="text-xs max-w-sm opacity-70">
                        {search || level !== "ALL"
                          ? "Try clearing your search query or changing the log level filter."
                          : "No background logs have been registered in the database yet."}
                      </p>
                      {(search || level !== "ALL") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs rounded-none"
                          onClick={() => {
                            setSearchInput("");
                            setSearch("");
                            setLevel("ALL");
                            setPage(1);
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? format(dateObj, "yyyy-MM-dd HH:mm:ss")
                    : String(log.timestamp);
                  const timeAgo = !isNaN(dateObj.getTime())
                    ? formatDistanceToNow(dateObj, { addSuffix: true })
                    : "";

                  const isErr = log.level?.toUpperCase() === "ERROR";
                  const isWarn = log.level?.toUpperCase() === "WARNING" || log.level?.toUpperCase() === "WARN";

                  return (
                    <TableRow
                      key={log.id}
                      className={cn(
                        "transition-all border-border/20 h-11 hover:bg-muted/40 cursor-pointer group",
                        isErr && "bg-rose-500/5 hover:bg-rose-500/10",
                        isWarn && "bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <TableCell className="py-2 px-3 border-r border-border/10">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-foreground/90 font-medium">
                            {formattedDate}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-sans">
                            {timeAgo}
                          </span>
                        </div>
                      </TableCell>

                      {/* Level */}
                      <TableCell className="py-2 px-3 border-r border-border/10">
                        {getLevelBadge(log.level)}
                      </TableCell>

                      {/* Logger */}
                      <TableCell className="py-2 px-3 border-r border-border/10">
                        <span
                          className="font-mono text-xs text-foreground/75 truncate block max-w-[200px]"
                          title={log.logger}
                        >
                          {log.logger}
                        </span>
                      </TableCell>

                      {/* Message */}
                      <TableCell className="py-2 px-3 border-r border-border/10">
                        <span
                          className={cn(
                            "font-mono text-xs block truncate max-w-[500px] xl:max-w-[700px]",
                            isErr ? "text-rose-400 font-semibold" : "text-muted-foreground group-hover:text-foreground"
                          )}
                          title={log.message}
                        >
                          {log.message}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="py-2 px-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-none"
                            onClick={() => handleCopy(log.message, log.id)}
                            title="Copy log message"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="sr-only">Copy</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none"
                            onClick={() => setSelectedLog(log)}
                            title="View log details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="sr-only">View</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination & Status Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border/40 bg-muted/20">
          {/* Range Info & Page Size */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-mono">
              Showing <span className="font-bold text-foreground">{startIdx}</span>-
              <span className="font-bold text-foreground">{endIdx}</span> of{" "}
              <span className="font-bold text-foreground">{total.toLocaleString()}</span> logs
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold">Rows:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-7 text-xs bg-background/60 border-border/40 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Navigation Buttons: First, Prev, Indicator, Next, Last */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">First</span>
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Prev</span>
            </Button>

            {/* Page Count Indicator */}
            <div className="px-3 text-xs font-mono font-medium text-muted-foreground whitespace-nowrap">
              Page <span className="font-bold text-foreground">{page}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span>
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              title="Next Page"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              title="Last Page"
            >
              <span className="hidden md:inline">Last</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      <Dialog open={selectedLog != null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl rounded-none bg-card border-border shadow-2xl p-6">
          {selectedLog && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="flex items-center gap-2 text-base font-bold font-mono">
                    <Terminal className="w-4 h-4 text-primary" />
                    <span>Log #{selectedLog.id}</span>
                  </DialogTitle>
                  <div>{getLevelBadge(selectedLog.level)}</div>
                </div>
                <DialogDescription className="text-xs font-mono text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                  <span>Timestamp: {format(new Date(selectedLog.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}</span>
                  <span>Logger: <strong className="text-foreground">{selectedLog.logger}</strong></span>
                </DialogDescription>
              </DialogHeader>

              {/* Message Content with Copy Button */}
              <div className="relative">
                <div className="flex items-center justify-between pb-1.5 text-xs text-muted-foreground font-semibold">
                  <span>Message Body:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1.5 rounded-none hover:bg-muted"
                    onClick={() => handleCopy(selectedLog.message)}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>

                <div className="bg-muted/40 border border-border/60 p-4 rounded-none overflow-x-auto max-h-[420px] custom-scrollbar">
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words text-foreground/90 select-text leading-relaxed">
                    {selectedLog.message}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
