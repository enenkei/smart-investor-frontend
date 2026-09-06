"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchTickersForComparison } from "@/controllers/stock-data-controller";

export interface MultiTickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "STOCK" | "ETF" | "ALL";
  className?: string;
}

export function MultiTickerSearch({
  value,
  onChange,
  placeholder = "Search symbol or company (Press Enter to add)...",
  type = "ALL",
  className,
}: MultiTickerSearchProps) {
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<
    { symbol: string; name: string; type: "STOCK" | "ETF"; sector: string }[]
  >([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Parse confirmed tickers from comma-separated string
  const selectedTickers = React.useMemo(() => {
    if (!value) return [];
    return value
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }, [value]);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  React.useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      const timer = setTimeout(() => {
        setSuggestions([]);
        setIsOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchTickersForComparison(trimmed, type);
        if (isMounted) {
          // Filter out already selected tickers from suggestions
          const filtered = results.filter(
            (r) => !selectedTickers.includes(r.symbol.toUpperCase())
          );
          setSuggestions(filtered);
          setIsOpen(filtered.length > 0);
          setActiveIndex(filtered.length > 0 ? 0 : -1);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [input, type, selectedTickers]);

  const addTicker = (tickerToAdd: string) => {
    const cleaned = tickerToAdd.trim().toUpperCase();
    if (!cleaned) return;

    if (!selectedTickers.includes(cleaned)) {
      const updated = [...selectedTickers, cleaned];
      onChange(updated.join(","));
    }

    setInput("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTicker = (tickerToRemove: string) => {
    const updated = selectedTickers.filter((t) => t !== tickerToRemove);
    onChange(updated.join(","));
  };

  const clearAllTickers = () => {
    onChange("");
    setInput("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        addTicker(suggestions[activeIndex].symbol);
      } else if (input.trim()) {
        addTicker(input);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Backspace" && input === "" && selectedTickers.length > 0) {
      // Remove the last ticker chip when backspacing on an empty input
      removeTicker(selectedTickers[selectedTickers.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative z-30 flex flex-wrap items-center gap-2.5 min-w-0", className)}>
      {/* Search Input Box */}
      <div className="relative z-40 w-full sm:w-72 md:w-80 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={selectedTickers.length > 0 ? "Add another ticker..." : placeholder}
          className="pl-9 pr-8 bg-background/50 border-none h-9 text-xs"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />

        {/* Action icons right inside the input */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin mr-1" />}
          {input ? (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded-sm transition-colors cursor-pointer"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-popover text-popover-foreground border border-border/70 shadow-2xl rounded-none max-h-64 overflow-y-auto custom-scrollbar">
            {suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <div
                  key={`${item.type}-${item.symbol}`}
                  className={cn(
                    "px-3 py-2 flex items-center justify-between cursor-pointer text-xs border-b border-border/20 last:border-b-0 transition-colors",
                    isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTicker(item.symbol);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-primary text-[11px] bg-primary/10 px-1.5 py-0.5 border border-primary/20 shrink-0">
                      {item.symbol}
                    </span>
                    <span className="text-muted-foreground truncate max-w-[150px] sm:max-w-[180px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-semibold">
                      {item.type}
                    </Badge>
                    {item.sector && (
                      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[90px]">
                        {item.sector}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="px-3 py-1.5 bg-muted/40 border-t border-border/30 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>
                Press <kbd className="px-1 py-0.5 bg-background border border-border/60 rounded text-[9px] font-mono">Enter ↵</kbd> to add
              </span>
              <span className="font-mono">{suggestions.length} found</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Tickers List Next to the Search Box */}
      {selectedTickers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
          {selectedTickers.map((ticker) => (
            <Badge
              key={ticker}
              variant="secondary"
              className="bg-primary/15 text-primary border border-primary/30 rounded-none px-2 py-0.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/20 transition-all"
            >
              <span>{ticker}</span>
              <button
                type="button"
                onClick={() => removeTicker(ticker)}
                className="hover:bg-primary/30 rounded-xs p-0.5 text-primary/80 hover:text-primary transition-colors cursor-pointer"
                aria-label={`Remove ${ticker}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {selectedTickers.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTickers}
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
