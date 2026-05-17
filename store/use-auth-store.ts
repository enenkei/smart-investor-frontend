import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    email: string;
    fullName?: string | null;
    pseudo?: string | null;
    avatarUrl?: string | null;
}


interface AuthState {
    user: User | null;
    sessionId: string | null;
    setAuth: (user: User | null, sessionId: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            sessionId: null,
            setAuth: (user, sessionId) => set({ user, sessionId }),
            logout: () => set({ user: null, sessionId: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);