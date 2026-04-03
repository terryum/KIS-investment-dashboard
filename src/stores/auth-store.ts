import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isPinVerified: boolean;
  setAuthenticated: (value: boolean) => void;
  setPinVerified: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isPinVerified: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setPinVerified: (value) =>
    set({ isPinVerified: value, isAuthenticated: value }),
  logout: () => set({ isAuthenticated: false, isPinVerified: false }),
}));
