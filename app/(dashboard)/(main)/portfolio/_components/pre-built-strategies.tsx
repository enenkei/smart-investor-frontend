"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { reseedPreBuiltStrategies, getStrategyHoldingsDetails, StrategyHoldingDetail } from "@/lib/actions/strategies";
import StrategyCopyDialog from "./strategy-copy-dialog";
import { Strategy, StrategyMode, STRATEGY_THEMES } from "./pre-built/types";
import { StrategySelectorBar } from "./pre-built/strategy-selector-bar";
import { StrategyMetricsHeader } from "./pre-built/strategy-metrics-header";
import { StrategyAllocationCard } from "./pre-built/strategy-allocation-card";
import { StrategyHoldingsTable } from "./pre-built/strategy-holdings-table";
import { StrategyMethodologyCard } from "./pre-built/strategy-methodology-card";
import { Layers, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreBuiltStrategiesProps {
  strategies: Strategy[];
}

export function PreBuiltStrategies({ strategies }: PreBuiltStrategiesProps) {
  const { fetchStrategies } = usePortfolioStore();

  const [selectedThemeId, setSelectedThemeId] = React.useState<string>("total-return-titan");
  const [selectedMode, setSelectedMode] = React.useState<StrategyMode>("mix");
  const [copyDialogOpen, setCopyDialogOpen] = React.useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = React.useState<boolean>(false);

  const [holdings, setHoldings] = React.useState<StrategyHoldingDetail[]>([]);
  const [isHoldingsLoading, setIsHoldingsLoading] = React.useState<boolean>(false);

  // Match the active strategy based on selected theme and mode
  const filteredStrategy = React.useMemo(() => {
    if (!strategies || strategies.length === 0) return null;

    // 1. Exact slug match: e.g. "total-return-titan-mix"
    const targetSlug = `${selectedThemeId}-${selectedMode}`;
    let match = strategies.find((s) => s.slug === targetSlug);

    // 2. Base slug match if mode is mix: e.g. "total-return-titan"
    if (!match && selectedMode === "mix") {
      match = strategies.find((s) => s.slug === selectedThemeId);
    }

    // 3. Fallback matching prefix and mode
    if (!match) {
      match = strategies.find((s) => s.slug.startsWith(selectedThemeId) && s.mode === selectedMode);
    }

    // 4. Fallback matching prefix only
    if (!match) {
      match = strategies.find((s) => s.slug.startsWith(selectedThemeId));
    }

    return match || strategies[0] || null;
  }, [strategies, selectedThemeId, selectedMode]);

  const currentTheme = React.useMemo(() => {
    return STRATEGY_THEMES.find((t) => t.id === selectedThemeId) || STRATEGY_THEMES[0];
  }, [selectedThemeId]);

  // Fetch holdings breakdown whenever the active strategy's tickers change
  React.useEffect(() => {
    let isMounted = true;
    if (filteredStrategy && filteredStrategy.tickers && filteredStrategy.tickers.length > 0) {
      setIsHoldingsLoading(true);
      getStrategyHoldingsDetails(filteredStrategy.tickers)
        .then((data) => {
          if (isMounted) {
            setHoldings(data);
            setIsHoldingsLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load strategy holdings:", err);
          if (isMounted) setIsHoldingsLoading(false);
        });
    } else {
      setHoldings([]);
    }

    return () => {
      isMounted = false;
    };
  }, [filteredStrategy?.slug, filteredStrategy?.tickers?.join(",")]);

  // Handle regenerating all strategies from database
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const toastId = toast.loading("Recalculating quantitative baskets from fundamental scores...");
    try {
      const res = await reseedPreBuiltStrategies();
      if (res.success) {
        await fetchStrategies();
        toast.success("Strategies recalculated successfully!", { id: toastId });
      } else {
        toast.error(`Recalculation failed: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedThemeId("total-return-titan");
    setSelectedMode("mix");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Filter & Mode Selection Bar */}
      <StrategySelectorBar
        selectedThemeId={selectedThemeId}
        selectedMode={selectedMode}
        onSelectTheme={setSelectedThemeId}
        onSelectMode={setSelectedMode}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {filteredStrategy ? (
          <motion.div
            key={filteredStrategy.slug}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Strategy Title & 4 KPI Metric Cards */}
            <StrategyMetricsHeader
              strategy={filteredStrategy}
              theme={currentTheme}
              mode={selectedMode}
              holdings={holdings}
            />

            {/* Split Row: Allocation Donut Card + Methodology Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <StrategyAllocationCard
                strategy={filteredStrategy}
                onOpenCopyDialog={() => setCopyDialogOpen(true)}
              />
              <StrategyMethodologyCard theme={currentTheme} />
            </div>

            {/* Holdings Table */}
            <StrategyHoldingsTable
              strategy={filteredStrategy}
              holdings={holdings}
              isLoading={isHoldingsLoading}
            />
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 bg-card/10 backdrop-blur-md rounded-none gap-4">
            <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">No Strategies Available</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                No quantitative strategies were found in the database. Click below to generate all 18 quantitative baskets from fundamental scores.
              </p>
            </div>
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="h-9 rounded-none font-bold uppercase text-xs tracking-wider gap-2"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              Generate Quantitative Strategies
            </Button>
          </div>
        )}
      </AnimatePresence>

      {/* Copy to Portfolio Dialog */}
      {filteredStrategy && (
        <StrategyCopyDialog
          isOpen={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          strategyName={filteredStrategy.display_name}
          tickers={filteredStrategy.tickers}
        />
      )}
    </div>
  );
}
