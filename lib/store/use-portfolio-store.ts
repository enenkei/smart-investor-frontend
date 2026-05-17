import { create } from 'zustand';
import { getStrategies } from '@/lib/actions/strategies';
import { getInvestors } from '@/lib/actions/investors';
import { getUserAssets, getUserPortfolios } from '@/lib/actions/assets';
import { strategies, user_assets, investor_directory, user_portfolio, watchlist } from '@/generated/prisma/client';
import { getWatchlist } from '@/controllers/stock-data-controller';

interface PortfolioState {
    strategies: strategies[];
    investors: investor_directory[];
    userAssets: user_assets[];
    userPortfolios: user_portfolio[];
    isLoading: boolean;
    error: string | null;
    watchlist: any[];

    fetchAll: () => Promise<void>;
    fetchStrategies: () => Promise<void>;
    fetchInvestors: () => Promise<void>;
    fetchUserAssets: () => Promise<void>;
    fetchUserPortfolios: () => Promise<void>;
    fetchWatchlist: () => Promise<void>;
    setInitialData: (data: { strategies: any[]; investors: any[]; userAssets: any[] }) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
    strategies: [],
    investors: [],
    userAssets: [],
    userPortfolios: [],
    isLoading: false,
    error: null,
    watchlist: [],
    setInitialData: (data) => set({ ...data }),
    fetchStrategies: async () => {
        try {
            const strategies = await getStrategies();
            set({ strategies });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchInvestors: async () => {
        try {
            const investors = await getInvestors();
            set({ investors });
        } catch (error: any) {
            set({ error: error.message });
        }
    },

    fetchUserAssets: async () => {
        try {
            const userAssets = await getUserAssets();
            set({ userAssets });
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    fetchAll: async () => {
        set({ isLoading: true });
        try {
            const [strategies, investors, userAssets, watchlist, userPortfolios] = await Promise.all([
                getStrategies(),
                getInvestors(),
                getUserAssets(),
                getWatchlist(),
                getUserPortfolios()
            ]);
            set({ strategies, investors, userAssets, watchlist, userPortfolios, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },
    fetchUserPortfolios: async () => {
        try {
            const userPortfolios = await getUserPortfolios();
            set({ userPortfolios });
        } catch (error: any) {
            set({ error: error.message });
        }
    },
    fetchWatchlist: async () => {
        try {
            const watchlist = await getWatchlist();
            set({ watchlist });
        } catch (error: any) {
            set({ error: error.message });
        }
    }
}));
