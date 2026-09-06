"use client";

import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Terminal } from "lucide-react";
import { ApplicationLog } from "@/controllers/log-controller";
import { LogLevelBadge } from "./log-level-badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface LogsTableProps {
  logs: ApplicationLog[];
  loading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSelectLog: (log: ApplicationLog) => void;
  footer?: React.ReactNode;
  className?: string;
}

export function LogsTable({
  logs,
  loading,
  hasFilters,
  onClearFilters,
  onSelectLog,
  footer,
  className,
}: LogsTableProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Log message copied to clipboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy log message");
    }
  };

  return (
    <div
      className={cn(
        "border border-border/50 bg-card/10 backdrop-blur-sm overflow-hidden rounded-none shadow-xl",
        className
      )}
    >
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
                      {hasFilters
                        ? "Try clearing your search query or changing the log level filter."
                        : "No background logs have been registered in the database yet."}
                    </p>
                    {hasFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs rounded-none"
                        onClick={onClearFilters}
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

                const isErr =
                  log.level?.toUpperCase() === "ERROR" ||
                  log.level?.toUpperCase() === "CRITICAL";
                const isWarn =
                  log.level?.toUpperCase() === "WARNING" ||
                  log.level?.toUpperCase() === "WARN";

                return (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "transition-all border-border/20 h-11 hover:bg-muted/40 cursor-pointer group",
                      isErr && "bg-rose-500/5 hover:bg-rose-500/10",
                      isWarn && "bg-amber-500/5 hover:bg-amber-500/10"
                    )}
                    onClick={() => onSelectLog(log)}
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
                      <LogLevelBadge level={log.level} />
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
                          isErr
                            ? "text-rose-400 font-semibold"
                            : "text-muted-foreground group-hover:text-foreground"
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
                          onClick={() => onSelectLog(log)}
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

      {footer}
    </div>
  );
}

export default LogsTable;
