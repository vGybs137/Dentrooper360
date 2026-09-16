import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { AUTH_STORE_KEY } from "@/constants/storage";
import { canonicalCustomerId } from "@/helpers/auth/customerId";
import { getItem, setItem } from "@/security/vault/secureStorage";
import type { AuthSession, AuthUser } from "@/types/auth";

type PersistedAuthState = {
  user: AuthUser | null;
  customerId: string | null;
  expiresAt: string | null;
  /** True when a refresh token exists in the biometric SecureStore vault. */
  hasRefreshCredential: boolean;
  /** Whether the vault entry was written with requireAuthentication. */
  refreshBoundToBiometrics: boolean;
};

type AuthStoreState = PersistedAuthState & {
  /** Memory-only access JWT — never persisted. */
  accessToken: string | null;
  /** Memory-cached refresh after unlock/login — never persisted. */
  refreshToken: string | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setCustomerId: (customerId: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setHasRefreshCredential: (value: boolean) => void;
  setRefreshBoundToBiometrics: (value: boolean) => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  clearAll: () => void;
};

/**
 * Ensures the persist blob never contains access/refresh tokens.
 * Pre-vault blobs that still embed tokens are discarded (re-login required).
 */
function sanitizePersistedAuthBlob(raw: string | null): string | null {
  if (!raw) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw) as {
      state?: Record<string, unknown>;
      version?: number;
    };

    if (!parsed.state || typeof parsed.state !== "object") {
      return raw;
    }

    const state = parsed.state;
    const hadEmbeddedTokens =
      typeof state.accessToken === "string" ||
      typeof state.refreshToken === "string";

    const nextState: PersistedAuthState = {
      user: (state.user as AuthUser | null) ?? null,
      customerId: (state.customerId as string | null) ?? null,
      expiresAt: (state.expiresAt as string | null) ?? null,
      hasRefreshCredential: hadEmbeddedTokens
        ? false
        : Boolean(state.hasRefreshCredential),
      refreshBoundToBiometrics: hadEmbeddedTokens
        ? false
        : Boolean(state.refreshBoundToBiometrics),
    };

    return JSON.stringify({
      ...parsed,
      state: nextState,
      version: 2,
    });
  } catch {
    return raw;
  }
}

const securePersistStorage: PersistStorage<PersistedAuthState> =
  createJSONStorage<PersistedAuthState>(() => ({
    getItem: async (name) => sanitizePersistedAuthBlob(await getItem(name)),
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
      hasRefreshCredential: false,
      refreshBoundToBiometrics: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setCustomerId: (customerId) =>
        set({ customerId: canonicalCustomerId(customerId) }),
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setHasRefreshCredential: (hasRefreshCredential) =>
        set({ hasRefreshCredential }),
      setRefreshBoundToBiometrics: (refreshBoundToBiometrics) =>
        set({ refreshBoundToBiometrics }),
      setSession: (session) =>
        set({
          user: session.user
            ? {
                ...session.user,
                customerId: canonicalCustomerId(session.user.customerId),
              }
            : session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt.toISOString(),
          hasRefreshCredential: Boolean(session.refreshToken),
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          hasRefreshCredential: false,
          refreshBoundToBiometrics: false,
        }),
      clearAll: () =>
        set({
          user: null,
          customerId: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          hasRefreshCredential: false,
          refreshBoundToBiometrics: false,
        }),
    }),
    {
      name: AUTH_STORE_KEY,
      version: 2,
      storage: securePersistStorage,
      partialize: (state) => ({
        user: state.user,
        customerId: state.customerId,
        expiresAt: state.expiresAt,
        hasRefreshCredential: state.hasRefreshCredential,
        refreshBoundToBiometrics: state.refreshBoundToBiometrics,
      }),
      onRehydrateStorage: () => (state) => {
        const storedCustomerId = state?.customerId;
        const canonical = canonicalCustomerId(storedCustomerId);
        if (canonical && storedCustomerId !== canonical) {
          state?.setCustomerId(canonical);
        }
        state?.setHasHydrated(true);
      },
    },
  ),
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

export function useHasRefreshCredential() {
  return useAuthStore((state) => state.hasRefreshCredential);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => Boolean(state.accessToken && state.user));
}

/** Session can be restored via biometric unlock (cold start). */
export function useCanUnlockSession() {
  return useAuthStore(
    (state) =>
      Boolean(state.hasRefreshCredential && state.user && state.customerId) &&
      !state.accessToken,
  );
}
