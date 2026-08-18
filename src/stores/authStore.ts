import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { AUTH_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";
import type { AuthSession, AuthUser } from "@/types/auth";

type PersistedAuthState = {
  user: AuthUser | null;
  customerId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthStoreState = PersistedAuthState & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setCustomerId: (customerId: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  clearAll: () => void;
};

const securePersistStorage: PersistStorage<PersistedAuthState> =
  createJSONStorage<PersistedAuthState>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      customerId: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setCustomerId: (customerId) => set({ customerId }),
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
      clearAll: () =>
        set({
          user: null,
          customerId: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: AUTH_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ user, customerId, accessToken, refreshToken }) => ({
        user,
        customerId,
        accessToken,
        refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

let hydrationPromise: Promise<void> | null = null;

export async function hydrateAuthStore(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) {
    return;
  }

  if (!hydrationPromise) {
    hydrationPromise = Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => undefined)
      .finally(() => {
        hydrationPromise = null;
      });
  }

  await hydrationPromise;
}

export function useAuthUser() {
  return useAuthStore((state) => state.user);
}

export function useCustomerId() {
  return useAuthStore((state) => state.customerId);
}

export function useAccessToken() {
  return useAuthStore((state) => state.accessToken);
}

export function useRefreshToken() {
  return useAuthStore((state) => state.refreshToken);
}

export function useHasHydrated() {
  return useAuthStore((state) => state.hasHydrated);
}

export function useIsAuthenticated() {
  return useAuthStore(
    (state) => Boolean(state.accessToken && state.refreshToken && state.user),
  );
}
