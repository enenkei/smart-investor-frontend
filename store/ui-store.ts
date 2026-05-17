import { create } from 'zustand';

interface UIState {
    hoveredTopic: string | null;
    setHoveredTopic: (topic: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    hoveredTopic: null,
    setHoveredTopic: (topic) => set({ hoveredTopic: topic }),
}));
