import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { BYPASS_AUTH, DEMO_CUSTOMER_ID } from "@/constants/auth";
import { AUTH_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";
import type { AuthSession, AuthUser } from "@/types/auth";

const DEV_MOCK_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Dev User",
  color: null,
  startingHour: "06:00",
  endingHour: "22:00",
};

const DEV_MOCK_SESSION: AuthSession = {
  accessToken: "dev-bypass-access-token",
  refreshToken: "dev-bypass-refresh-token",
  expiresAt: new Date("2099-12-31T23:59:59.000Z"),
  user: DEV_MOCK_USER,
};

function applyAuthBypass(): void {
  if (!BYPASS_AUTH) {
    return;
  }

  const store = useAuthStore.getState();
  if (!store.customerId) {
    store.setCustomerId(DEMO_CUSTOMER_ID);
  }
  if (!store.user || !store.accessToken || !store.refreshToken) {
    store.setSession(DEV_MOCK_SESSION);
  }
}

type PersistedAuthState = {
  user: AuthUser | null;
  customerId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
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
      expiresAt: null,
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
          expiresAt: session.expiresAt.toISOString(),
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),
      clearAll: () =>
        set({
          user: null,
          customerId: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),
    }),
    {
      name: AUTH_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ user, customerId, accessToken, refreshToken, expiresAt }) => ({
        user,
        customerId,
        accessToken,
        refreshToken,
        expiresAt,
      }),
      onRehydrateStorage: () => () => {
        applyAuthBypass();
        useAuthStore.getState().setHasHydrated(true);
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
  return useAuthStore((state) => state.user ?? (BYPASS_AUTH ? DEV_MOCK_USER : null));
}

export function useCustomerId() {
  return useAuthStore((state) =>
    state.customerId ?? (BYPASS_AUTH ? DEMO_CUSTOMER_ID : null),
  );
}

export function useAccessToken() {
  return useAuthStore((state) => state.accessToken);
}

export function useRefreshToken() {
  return useAuthStore((state) => state.refreshToken);
}

export function useAccessTokenExpiresAt(): Date | null {
  const expiresAt = useAuthStore((state) => state.expiresAt);
  return expiresAt ? new Date(expiresAt) : null;
}

export function getAccessTokenExpiresAt(): Date | null {
  const expiresAt = useAuthStore.getState().expiresAt;
  return expiresAt ? new Date(expiresAt) : null;
}

export function useHasHydrated() {
  return useAuthStore((state) => state.hasHydrated);
}

export function useIsAuthenticated() {
  return useAuthStore(
    (state) =>
      BYPASS_AUTH ||
      Boolean(state.accessToken && state.refreshToken && state.user),
  );
}
