// stores/auth.store.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiUser } from "../services/auth.api";

type AuthState = {
  user: ApiUser | null;
  token: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  setSession: (payload: { user: ApiUser; token: string }) => Promise<void>;
  setUser: (user: ApiUser) => void;

  signOut: () => Promise<void>;
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      const user = userStr ? (JSON.parse(userStr) as ApiUser) : null;

      set({ token: token ?? null, user, hydrated: true });
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },

  setSession: async ({ user, token }) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
    ]);

    set({ user, token });
  },

  setUser: (user) => {
    set({ user });
    // persist user update (avatar/name/email change)
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
  },

  signOut: async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);

    set({ user: null, token: null });
  },
}));
