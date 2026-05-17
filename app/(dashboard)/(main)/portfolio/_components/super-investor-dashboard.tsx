"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInvestorHoldings } from "@/lib/actions/investors";
import { motion, AnimatePresence } from "framer-motion";
import { Info, User, Briefcase, TrendingUp, Search, Layers, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StrategyCopyDialog from "./strategy-copy-dialog";

interface Investor {
  cik: string;
  display_name: string | null;
  legal_name: string | null;
}

interface Holding {
  ticker: string;
  position_value: number | null;
  percent_of_portfolio: number | null;
  sector: string;
  isNewAddition: boolean;
}

interface SuperInvestorDashboardProps {
  investors: Investor[];
  strategyTickers: Set<string>;
}

const SECTORS = [
  'Industrials', 'Health Care', 'Information Technology', 'Utilities',
  'Financials', 'Materials', 'Consumer Discretionary', 'Real Estate',
  'Communication Services', 'Consumer Staples', 'Energy'
];

export function SuperInvestorDashboard({ investors, strategyTickers }: SuperInvestorDashboardProps) {
  const [selectedCik, setSelectedCik] = React.useState<string>(investors[0]?.cik || "");
  const [holdings, setHoldings] = React.useState<Holding[]>([]);
  const [timeHorizon, setTimeHorizon] = React.useState<"all" | "new" | "long-term">("all");
  const [selectedSectors, setSelectedSectors] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (selectedCik) {
      setLoading(true);
      getInvestorHoldings(selectedCik).then((data) => {
        setHoldings(data as any);
        setLoading(false);
      });
    }
  }, [selectedCik]);

  const filteredHoldings = React.useMemo(() => {
    return holdings.filter((h) => {
      const matchesSearch = h.ticker.toLowerCase().includes(search.toLowerCase());
      const matchesSector = selectedSectors.length === 0 || selectedSectors.includes(h.sector);
      const matchesTime =
        timeHorizon === "all" ||
        (timeHorizon === "new" && h.isNewAddition) ||
        (timeHorizon === "long-term" && !h.isNewAddition);

      return matchesSearch && matchesSector && matchesTime;
    });
  }, [holdings, search, selectedSectors, timeHorizon]);

  const selectedInvestor = investors.find(i => i.cik === selectedCik);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar Filters */}
      <aside className="w-80 border border-border/50 bg-card/20 backdrop-blur-xl rounded-none p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary/70">Filters</h3>
            <button
              onClick={() => {
                setTimeHorizon("all");
                setSelectedSectors([]);
                setSearch("");
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Investor Select */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Select Investor</Label>
            <Select value={selectedCik} onValueChange={setSelectedCik}>
              <SelectTrigger className="w-full bg-background/50 border-border/50 font-medium text-sm h-10 rounded-none">
                <SelectValue placeholder="Select investor" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((i) => (
                  <SelectItem key={i.cik} value={i.cik}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {i.display_name || i.legal_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Horizon */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Time Horizon</Label>
            <Tabs value={timeHorizon} onValueChange={(v: any) => setTimeHorizon(v)} className="w-full">
              <TabsList className="grid grid-cols-3 bg-background/50 border border-border/50 rounded-none h-10">
                <TabsTrigger value="all" className="text-[10px] uppercase font-bold rounded-none">All</TabsTrigger>
                <TabsTrigger value="new" className="text-[10px] uppercase font-bold rounded-none">New</TabsTrigger>
                <TabsTrigger value="long-term" className="text-[10px] uppercase font-bold rounded-none">Hold</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filter by Sector */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Filter by Sector</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {SECTORS.map((sector) => (
                <div key={sector} className="flex items-center space-x-2 group cursor-pointer" onClick={() => {
                  setSelectedSectors(prev =>
                    prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
                  );
                }}>
                  <Checkbox
                    id={`sector-${sector}`}
                    checked={selectedSectors.includes(sector)}
                    className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`sector-${sector}`}
                    className="text-xs font-medium text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors"
                  >
                    {sector}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Analysis Area */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <Card className="bg-card/20 backdrop-blur-xl border-border/50 rounded-none flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-background/20 px-6 py-4 flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">
                {selectedInvestor?.display_name || selectedInvestor?.legal_name} Portfolio
              </CardTitle>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-muted-foreground">Tracking latest SEC 13F filings</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-none border-primary/30 text-primary hover:bg-primary/10 font-bold text-[9px] uppercase tracking-widest gap-2"
                  onClick={() => setCopyDialogOpen(true)}
                >
                  <Copy className="w-3 h-3" />
                  Copy Portfolio
                </Button>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickers..."
                className="pl-8 bg-background/50 border-border/50 h-9 rounded-none text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground w-24">Ticker</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground">Sector</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">Value</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-right">% Portfolio</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Intel</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-muted-foreground text-center">Horizon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredHoldings.map((h) => (
                      <TableRow key={h.ticker} className="border-border/50 hover:bg-primary/5 transition-colors group">
                        <TableCell className="font-black text-sm group-hover:text-primary transition-colors italic">{h.ticker}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.sector}</TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          ${h.position_value ? (h.position_value / 1e6).toFixed(1) : "0"}M
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-primary">
                          {h.percent_of_portfolio ? h.percent_of_portfolio.toFixed(2) : "0"}%
                        </TableCell>
                        <TableCell className="text-center">
                          {strategyTickers.has(h.ticker) && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 animate-pulse">
                              <Layers className="w-2.5 h-2.5 mr-1" />
                              Overlap
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {h.isNewAddition ? (
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-green-500/20 text-green-500 bg-green-500/5 px-2 py-0.5">
                              New
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-blue-500/20 text-blue-500 bg-blue-500/5 px-2 py-0.5">
                              Hold
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
            {!loading && filteredHoldings.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">No holdings found matching the criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {selectedInvestor && (
        <StrategyCopyDialog
          isOpen={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          strategyName={`${selectedInvestor.display_name || selectedInvestor.legal_name} Portfolio`}
          tickers={filteredHoldings.map(h => h.ticker)}
        />
      )}
    </div>
  );
}
