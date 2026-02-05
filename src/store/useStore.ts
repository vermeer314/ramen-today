import { create } from 'zustand';

interface AppState {
  isAdmin: boolean;
  toggleIsAdmin: () => void;
}

export const useStore = create<AppState>((set) => ({
  isAdmin: false,
  toggleIsAdmin: () => set((state) => ({ isAdmin: !state.isAdmin })),
}));
