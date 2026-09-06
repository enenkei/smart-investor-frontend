"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TablePaginationFooterProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  total?: number;
  pageSize?: number;
  onPageSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  loading?: boolean;
  className?: string;
  showFirstLast?: boolean;
}

export function TablePaginationFooter({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50, 100],
  itemName = "items",
  loading = false,
  className,
  showFirstLast = true,
}: TablePaginationFooterProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const startIdx = total != null && pageSize != null
    ? total === 0 ? 0 : (page - 1) * pageSize + 1
    : undefined;
  const endIdx = total != null && pageSize != null
    ? Math.min(page * pageSize, total)
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border/40 bg-muted/20",
        className
      )}
    >
      {/* Range Info & Page Size */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {startIdx !== undefined && endIdx !== undefined && total !== undefined ? (
          <span className="font-mono">
            Showing <span className="font-bold text-foreground">{startIdx}</span>-
            <span className="font-bold text-foreground">{endIdx}</span> of{" "}
            <span className="font-bold text-foreground">{total.toLocaleString()}</span>{" "}
            {itemName}
          </span>
        ) : total !== undefined ? (
          <span className="font-mono">
            Total <span className="font-bold text-foreground">{total.toLocaleString()}</span>{" "}
            {itemName}
          </span>
        ) : (
          <span className="font-mono">
            Page <span className="font-bold text-foreground">{page}</span> of{" "}
            <span className="font-bold text-foreground">{safeTotalPages}</span>
          </span>
        )}

        {pageSize !== undefined && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold">Rows:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="w-[70px] h-7 text-xs bg-background/60 border-border/40 rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || loading}
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">First</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Prev</span>
        </Button>

        <div className="px-3 text-xs font-mono font-medium text-muted-foreground whitespace-nowrap">
          Page <span className="font-bold text-foreground">{page}</span> of{" "}
          <span className="font-bold text-foreground">{safeTotalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={page >= safeTotalPages || loading}
          title="Next Page"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>

        {showFirstLast && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 gap-1 text-xs rounded-none bg-background/60 border-border/40"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={page >= safeTotalPages || loading}
            title="Last Page"
          >
            <span className="hidden md:inline">Last</span>
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default TablePaginationFooter;
