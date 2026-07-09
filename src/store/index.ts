import { create } from 'zustand';

// Le store ne fait PLUS rien persister dans localStorage : tout passe par
// Supabase (auth + database + storage). Ce store ne sert qu'à des
// messages éphémères UI (ex: notification après inscription).

interface AppState {
  notice: string | null;
  setNotice: (msg: string | null) => void;
  clearNotice: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  notice: null,
  setNotice: (msg) => set({ notice: msg }),
  clearNotice: () => set({ notice: null }),
}));
