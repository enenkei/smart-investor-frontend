"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PreBuiltStrategies } from "./pre-built-strategies";
import { SuperInvestorDashboard } from "./super-investor-dashboard";
import BuildPortfolio from "./build-portfolio";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { useEffect } from "react";

export default function PortfolioClient() {
    const { strategies, investors, fetchAll } = usePortfolioStore();

    useEffect(() => {
        fetchAll();
    }, []);


    const strategyTickers = new Set(strategies.flatMap(s => s.tickers));

    return (
        <Tabs defaultValue="pre-built" className="w-full">
            <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-card/20 backdrop-blur-xl border border-border/50 p-1 rounded-none">
                    <TabsTrigger
                        value="manual"
                        className="px-8 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                        Manual
                    </TabsTrigger>
                    <TabsTrigger
                        value="pre-built"
                        className="px-8 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                        Pre-built strategies
                    </TabsTrigger>
                    <TabsTrigger
                        value="super-investor"
                        className="px-8 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                        Super Investors
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="manual" className="mt-0 focus-visible:outline-none">
                <BuildPortfolio />
            </TabsContent>

            <TabsContent value="pre-built" className="mt-0 focus-visible:outline-none outline-none ring-0">
                <PreBuiltStrategies strategies={strategies as any} />
            </TabsContent>

            <TabsContent value="super-investor" className="mt-0 focus-visible:outline-none outline-none ring-0">
                <SuperInvestorDashboard investors={investors} strategyTickers={strategyTickers} />
            </TabsContent>
        </Tabs>
    );
}
