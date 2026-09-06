"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, ArrowUpDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogFilterControlBarProps {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onClearSearch: () => void;
  level: string;
  onLevelChange: (val: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSortOrder: () => void;
  autoRefreshInterval: number;
  onAutoRefreshIntervalChange: (val: number) => void;
  onRefresh: () => void;
  loading: boolean;
  className?: string;
}

export function LogFilterControlBar({
  searchInput,
  onSearchInputChange,
  onClearSearch,
  level,
  onLevelChange,
  sortOrder,
  onToggleSortOrder,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
  onRefresh,
  loading,
  className,
}: LogFilterControlBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card/20 p-4 border border-border/50 rounded-none backdrop-blur-sm shadow-sm",
        className
      )}
    >
      {/* Left: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
        {/* Search box */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search log message or logger..."
            className="pl-9 pr-8 bg-background/60 border-border/40 h-9 text-xs rounded-none"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
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
          <Select value={level} onValueChange={onLevelChange}>
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
          onClick={onToggleSortOrder}
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
          <span className="text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline">
            Auto-refresh:
          </span>
          <Select
            value={autoRefreshInterval.toString()}
            onValueChange={(val) => onAutoRefreshIntervalChange(Number(val))}
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
          onClick={onRefresh}
          disabled={loading}
          className="h-9 px-3 gap-1.5 text-xs rounded-none bg-background/60 border-border/40"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-primary")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}

export default LogFilterControlBar;
