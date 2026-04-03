import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  selectedAccount: string | null;
  refreshing: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
  setSelectedAccount: (accountId: string | null) => void;
  setRefreshing: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  selectedAccount: null,
  refreshing: false,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSelectedAccount: (accountId) => set({ selectedAccount: accountId }),
  setRefreshing: (value) => set({ refreshing: value }),
}));
