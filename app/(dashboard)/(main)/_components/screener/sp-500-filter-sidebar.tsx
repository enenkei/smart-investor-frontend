"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

interface Sp500FilterSidebarProps {
  filters: {
    minYield: number;
    minCagr: number;
    maxPayout: number;
    maxPe: number;
    minFcfYield: number;
    maxRsi: number;
    dist52wLow: string;
  };
  onFilterChange: (filters: any) => void;
}

const FilterHelp = ({ title, description }: { title: string, description: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="focus:outline-none flex items-center justify-center">
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-3 text-xs bg-card/95 backdrop-blur-xl border-border/50 rounded-none shadow-xl" side="right" align="start">
      <div className="space-y-1.5">
        <h4 className="font-bold text-primary tracking-tight">{title}</h4>
        <p className="text-muted-foreground leading-snug">{description}</p>
      </div>
    </PopoverContent>
  </Popover>
);

export function Sp500FilterSidebar({ filters, onFilterChange }: Sp500FilterSidebarProps) {
  return (
    <aside className="w-80 border-r border-border bg-card/30 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary">Filters</h2>
        <button 
          onClick={() => onFilterChange({
            minYield: 0,
            minCagr: 0,
            maxPayout: 100,
            maxPe: 50,
            minFcfYield: 0,
            maxRsi: 100,
            dist52wLow: "all",
          })}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="flex flex-col gap-8">
        <div className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-tighter text-primary/50">Dividends</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Min Yield %</Label>
                <FilterHelp 
                  title="Minimum Dividend Yield" 
                  description="Filters for stocks that pay an annualized dividend yield greater than or equal to this percentage. Higher yield means more income, but extremely high yields can indicate distress." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.minYield}%</span>
            </div>
            <Slider
              value={[filters.minYield]}
              max={10}
              step={0.1}
              onValueChange={([val]) => onFilterChange({ ...filters, minYield: val })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">5Y Dividend CAGR</Label>
                <FilterHelp 
                  title="5-Year Dividend CAGR" 
                  description="Filters for stocks that have grown their dividend by at least this annualized rate over the past 5 years. A higher rate indicates strong and accelerating dividend growth." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.minCagr}%</span>
            </div>
            <Slider
              value={[filters.minCagr]}
              max={25}
              step={0.5}
              onValueChange={([val]) => onFilterChange({ ...filters, minCagr: val })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max Payout Ratio</Label>
                <FilterHelp 
                  title="Maximum Payout Ratio" 
                  description="Filters out companies that pay out more than this percentage of their earnings as dividends. A lower ratio typically implies a safer and more sustainable dividend." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.maxPayout}%</span>
            </div>
            <Slider
              value={[filters.maxPayout]}
              max={100}
              step={1}
              onValueChange={([val]) => onFilterChange({ ...filters, maxPayout: val })}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-tighter text-primary/50">Valuation</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max P/E Ratio</Label>
                <FilterHelp 
                  title="Maximum P/E Ratio" 
                  description="Filters for stocks with a Price-to-Earnings ratio below this threshold. A lower P/E suggests the stock may be undervalued relative to its earnings." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.maxPe}</span>
            </div>
            <Slider
              value={[filters.maxPe]}
              max={100}
              step={1}
              onValueChange={([val]) => onFilterChange({ ...filters, maxPe: val })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Min FCF Yield %</Label>
                <FilterHelp 
                  title="Minimum FCF Yield" 
                  description="Filters for stocks generating Free Cash Flow yield above this percentage. High FCF yield indicates a company is highly cash-generative relative to its valuation." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.minFcfYield}%</span>
            </div>
            <Slider
              value={[filters.minFcfYield]}
              max={15}
              step={0.5}
              onValueChange={([val]) => onFilterChange({ ...filters, minFcfYield: val })}
            />
          </div>
        </div>

        <div className="space-y-6 pb-8">
          <h2 className="text-sm font-black uppercase tracking-tighter text-primary/50">Technicals</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max RSI</Label>
                <FilterHelp 
                  title="Maximum RSI (14-Day)" 
                  description="Filters based on the Relative Strength Index. An RSI under 30 often indicates oversold conditions, while values near 100 suggest the stock is overbought and extended." 
                />
              </div>
              <span className="text-xs font-mono font-bold text-primary">{filters.maxRsi}</span>
            </div>
            <Slider
              value={[filters.maxRsi]}
              max={100}
              step={1}
              onValueChange={([val]) => onFilterChange({ ...filters, maxRsi: val })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dist. from 52W Low</Label>
              <FilterHelp 
                title="Distance from 52-Week Low" 
                description="Filters for stocks trading within a certain percentage of their lowest price over the past year. Useful for identifying 'bottom-fishing' or mean-reversion opportunities." 
              />
            </div>
            <Select 
              value={filters.dist52wLow} 
              onValueChange={(val) => onFilterChange({ ...filters, dist52wLow: val })}
            >
              <SelectTrigger className="w-full bg-muted/50 border-none font-mono text-xs h-8">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Distance</SelectItem>
                <SelectItem value="5">Within 5%</SelectItem>
                <SelectItem value="10">Within 10%</SelectItem>
                <SelectItem value="20">Within 20%</SelectItem>
                <SelectItem value="30">Within 30%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </aside>
  );
}

