import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { setAuthToken } from "@shared/api/client";
import type { MobileUser } from "@shared/types";

interface AuthState {
  token: string | null;
  user: MobileUser | null;
  isHydrated: boolean;
  setAuth: (token: string, user: MobileUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setAuth: async (token: string, user: MobileUser) => {
    await SecureStore.setItemAsync("rs_token", token);
    await SecureStore.setItemAsync("rs_user", JSON.stringify(user));
    setAuthToken(token);
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("rs_token");
    await SecureStore.deleteItemAsync("rs_user");
    setAuthToken(null);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("rs_token");
      const userStr = await SecureStore.getItemAsync("rs_user");
      if (token && userStr) {
        setAuthToken(token);
        set({ token, user: JSON.parse(userStr), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));
