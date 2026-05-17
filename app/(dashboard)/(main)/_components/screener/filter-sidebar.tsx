"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    minYield: number;
    maxRsi: number;
    maxExpense: number;
    assetClasses: string[];
  };
  onFilterChange: (filters: any) => void;
}

const assetClasses = ["Equity", "Fixed Income", "Commodities", "Specialty"];

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

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const toggleAssetClass = (ac: string) => {
    const newClasses = filters.assetClasses.includes(ac)
      ? filters.assetClasses.filter((c) => c !== ac)
      : [...filters.assetClasses, ac];
    onFilterChange({ ...filters, assetClasses: newClasses });
  };

  const resetFilters = () => {
    onFilterChange({
      minYield: 0,
      maxRsi: 100,
      maxExpense: 2.0,
      assetClasses: ["Equity", "Fixed Income", "Commodities", "Specialty"],
    });
  };

  return (
    <aside className="w-80 border-r border-border bg-card/30 p-6 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/50">Strategy Filters</h2>
        <button
          onClick={resetFilters}
          className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-primary transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Dividend Yield</Label>
            <FilterHelp
              title="Minimum Dividend Yield"
              description="Filters for ETFs that pay an annualized dividend yield greater than or equal to this percentage. Targeting high-yield income producers."
            />
          </div>
          <span className="text-sm font-mono font-bold text-primary">{filters.minYield}%</span>
        </div>
        <Slider
          value={[filters.minYield]}
          max={15}
          step={0.1}
          onValueChange={([val]) => onFilterChange({ ...filters, minYield: val })}
        />
        <p className="text-[10px] text-muted-foreground italic opacity-50 hidden">Targeting high-yield income producers.</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max RSI (Momentum)</Label>
            <FilterHelp
              title="Maximum RSI (14-Day)"
              description="Filters based on the Relative Strength Index. An RSI under 40 indicates oversold conditions and potential buying opportunities."
            />
          </div>
          <span className="text-sm font-mono font-bold text-primary">{filters.maxRsi}</span>
        </div>
        <Slider
          value={[filters.maxRsi]}
          max={100}
          step={1}
          onValueChange={([val]) => onFilterChange({ ...filters, maxRsi: val })}
        />
        <p className="text-[10px] text-muted-foreground italic opacity-50 hidden">Targeting oversold conditions (RSI &lt; 40).</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Expense Ratio %</Label>
          <FilterHelp
            title="Maximum Expense Ratio"
            description="Filters out ETFs with high management fees. A lower expense ratio helps preserve your returns over the long term."
          />
        </div>
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.50"
            className="font-mono bg-muted/20 border-none h-10 pr-8"
            value={filters.maxExpense}
            onChange={(e) => onFilterChange({ ...filters, maxExpense: parseFloat(e.target.value) || 0 })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">%</span>
        </div>
      </div>


      <div className="space-y-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Class</Label>
          <FilterHelp
            title="Asset Class"
            description="Filter ETFs by their underlying asset class, allowing you to diversify across Equity, Fixed Income, Commodities, or Specialty assets."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {assetClasses.map((ac) => (
            <Badge
              key={ac}
              variant={filters.assetClasses.includes(ac) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all border-none py-1.5 px-3 rounded-none text-[10px] font-bold uppercase tracking-tight",
                filters.assetClasses.includes(ac)
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-muted/50 hover:bg-muted-foreground/20"
              )}
              onClick={() => toggleAssetClass(ac)}
            >
              {ac}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
}
