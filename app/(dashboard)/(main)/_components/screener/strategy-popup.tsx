import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    HelpCircle,
    Shield,
} from "lucide-react";

const StrategyPopup = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="hover:text-primary transition-colors">
                    <HelpCircle size={10} strokeWidth={3} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card/95 backdrop-blur-md border-border/50 shadow-2xl p-4">
                <div className="space-y-4">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary border-b border-border/50 pb-2 flex items-center gap-2">
                        <Shield size={12} /> Strategy Intelligence
                    </h4>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Balanced Compounder</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                The "Goldilocks" zone. Yield 2-4%, CAGR &gt; 8%, Payout &lt; 50%. Steady income with inflation-beating raises.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Aggressive Grower</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                The Future Income. Yield &lt; 1.5%, EPS Growth &gt; 15%, Quality &gt; 80. High total return and business quality.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Cash Cow</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Pure Income. Yield &gt; 5%, FCF &gt; Yield, Beta &lt; 0.9. Slow growth but high reliability for monthly income.
                            </p>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
export default StrategyPopup;