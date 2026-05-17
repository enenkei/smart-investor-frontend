import PortfolioClient from "./_components/portfolio-client";

export default function PortfolioPage() {
    return (
        <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter uppercase text-primary italic">Portfolio</h1>
                <p className="text-muted-foreground text-sm font-medium">Manage your investments and explore AI-driven strategies.</p>
            </div>

            <PortfolioClient />
        </div>
    );
}   