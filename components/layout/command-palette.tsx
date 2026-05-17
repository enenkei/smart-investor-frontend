"use client";

import * as React from "react";
import { Search, CircleDollarSign, BarChart3, Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const suggestions = [
  { group: "Tickers", items: [
    { label: "NVDA - NVIDIA Corporation", icon: CircleDollarSign },
    { label: "AAPL - Apple Inc.", icon: CircleDollarSign },
    { label: "TSLA - Tesla, Inc.", icon: CircleDollarSign },
  ]},
  { group: "Actions", items: [
    { label: "View ETF Screener", icon: BarChart3 },
    { label: "Read Latest News", icon: Newspaper },
  ]},
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-xl overflow-hidden border-none shadow-2xl bg-popover/95 backdrop-blur-xl">
        <DialogHeader className="p-4 border-b border-border/50">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              autoFocus
              placeholder="Search tickers, news, or actions..." 
              className="border-none bg-transparent focus-visible:ring-0 text-sm h-10 p-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto p-2">
          {suggestions.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              <h3 className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {group.group}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors group text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border/50 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="px-1 bg-muted rounded border border-border">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 bg-muted rounded border border-border">↑↓</kbd> Navigate</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="px-1 bg-muted rounded border border-border">ESC</kbd> Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
