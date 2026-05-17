import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    HelpCircle,
    Target,
    AlertTriangle,
} from "lucide-react";

const IntelPopup = () => {
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
                        <Target size={12} /> Timing & Risk Intelligence
                    </h4>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Opportunity Window</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Strong Buy. Quality &gt; 85 &amp; RSI &lt; 35. A top-tier business that is currently "on sale."
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Fair Value Holder</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Neutral. Quality &gt; 70 &amp; RSI 45-65. Efficient price point; no rush to buy or sell.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Profit Taker</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Potential Trim. RSI &gt; 75 &amp; Elevated P/E. Overextended momentum; high risk of a technical pullback.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Value Trap</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Avoid. Yield &gt; 7%, Payout &gt; 90%, FCF &lt; Yield. Juicy yield but unsustainable; high risk of dividend cut.
                            </p>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default IntelPopup;