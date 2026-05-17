"use client";

import { useState, useEffect } from "react";
import { Asset, columns } from "./column";
import { DataTable } from "./data-table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePortfolio } from "@/lib/actions/assets";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
// import { getUserPortfolios } from "@/lib/actions/assets";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioStore } from "@/lib/store/use-portfolio-store";
import { user_assets } from "@/generated/prisma/client";


const UserPortfolio = (props: { setPortfolioId: (id: number) => void }) => {
    const { setPortfolioId } = props;
    // const [portfolios, setPortfolios] = useState<any[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>();
    const [assets, setAssets] = useState<user_assets[]>([]);
    const { fetchUserPortfolios, fetchUserAssets, fetchWatchlist, userAssets, userPortfolios } = usePortfolioStore();

    useEffect(() => {
        fetchUserPortfolios();
        fetchUserAssets();
        fetchWatchlist();
    }, []);


    useEffect(() => {
        if (userPortfolios.length > 0 && !selectedPortfolioId) {
            const firstId = userPortfolios[0].id.toString();
            handlePortfolioChange(firstId);
        }
    }, [userPortfolios, selectedPortfolioId]);

    useEffect(() => {
        if (selectedPortfolioId) {
            const filtered = userAssets.filter(p => p.portfolio_id === Number(selectedPortfolioId));
            setAssets(filtered);
        }
    }, [userAssets, selectedPortfolioId]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const handlePortfolioChange = (id: string) => {
        setSelectedPortfolioId(id);
        setPortfolioId(Number(id));
    };

    const handleDeletePortfolio = async () => {
        if (!selectedPortfolioId) return;
        setIsDeleting(true);
        try {
            await deletePortfolio(Number(selectedPortfolioId));
            toast.success("Portfolio deleted successfully");
            await fetchUserPortfolios();
            await fetchUserAssets();
            await fetchWatchlist();
            setSelectedPortfolioId(undefined);
            setPortfolioId(0);
        } catch (error: any) {

            toast.error("Failed to delete portfolio: " + error.message);
        } finally {
            setIsDeleting(false);
            setConfirmDialogOpen(false);
        }
    };

    const selectedPortfolioName = userPortfolios.find(p => p.id === Number(selectedPortfolioId))?.name;

    return (
        <div className="flex flex-col h-full">
            <CardHeader className="border-b border-border/50 bg-muted/5 px-6 py-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black tracking-tighter uppercase italic text-primary">Portfolio History</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">View your saved allocations</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-64">
                        <Select value={selectedPortfolioId} onValueChange={handlePortfolioChange}>
                            <SelectTrigger className="rounded-none bg-background/50 border-border/50 font-bold">
                                <SelectValue placeholder="Select a portfolio" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-border/60">
                                {userPortfolios.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()} className="rounded-none font-mono text-xs">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedPortfolioId && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDialogOpen(true)}
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none border border-border/50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <div className="flex-1 p-0">
                <DataTable columns={columns} data={assets} />
            </div>

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="rounded-none border-border/60">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter text-destructive">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            Are you sure you want to delete <span className="font-bold text-foreground">"{selectedPortfolioName}"</span>? This will permanently remove all saved assets and projections for this portfolio.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                            className="rounded-none font-bold uppercase text-[10px] tracking-widest"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeletePortfolio}
                            className="rounded-none font-bold uppercase text-[10px] tracking-widest gap-2"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Delete Portfolio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );

};

export default UserPortfolio;
