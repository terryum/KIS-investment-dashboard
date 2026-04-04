import { create } from "zustand";

interface LoadingItem {
  key: string;
  label: string;
  loaded: boolean;
}

interface UiState {
  sidebarCollapsed: boolean;
  selectedAccount: string | null;
  refreshing: boolean;
  loadingItems: LoadingItem[];
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  setSelectedAccount: (accountId: string | null) => void;
  setRefreshing: (value: boolean) => void;
  setLoadingItem: (key: string, label: string, loaded: boolean) => void;
  resetLoading: () => void;
  getLoadingProgress: () => number;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  selectedAccount: null,
  refreshing: false,
  loadingItems: [],
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSelectedAccount: (accountId) => set({ selectedAccount: accountId }),
  setRefreshing: (value) => set({ refreshing: value }),
  setLoadingItem: (key, label, loaded) =>
    set((state) => {
      const existing = state.loadingItems.findIndex((i) => i.key === key);
      const next = [...state.loadingItems];
      if (existing >= 0) {
        next[existing] = { key, label, loaded };
      } else {
        next.push({ key, label, loaded });
      }
      return { loadingItems: next };
    }),
  resetLoading: () => set({ loadingItems: [] }),
  getLoadingProgress: () => {
    const items = get().loadingItems;
    if (items.length === 0) return 100;
    const loaded = items.filter((i) => i.loaded).length;
    return Math.round((loaded / items.length) * 100);
  },
}));
