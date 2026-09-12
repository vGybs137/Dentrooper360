import {
  hydrateAuthStore,
  useAccessToken,
  useAuthStore,
  useAuthUser,
  useCustomerId,
  useIsAuthenticated,
  useRefreshToken,
} from "@/stores/authStore";
import type { AuthSession, AuthUser } from "@/types/auth";

/**
 * Session vault facade.
 * Phase 5 splits access (memory) vs refresh (biometric SecureStore).
 * Phase 0 keeps the existing Zustand + SecureStore persistence model.
 */
export function getSessionSnapshot() {
  const state = useAuthStore.getState();
  return {
    user: state.user,
    customerId: state.customerId,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    expiresAt: state.expiresAt,
  };
}

export function setSession(session: AuthSession): void {
  useAuthStore.getState().setSession(session);
}

export function clearSession(): void {
  useAuthStore.getState().clearSession();
}

export function clearAllSecurityState(): void {
  useAuthStore.getState().clearAll();
}

export function setPairedCustomerId(customerId: string | null): void {
  useAuthStore.getState().setCustomerId(customerId);
}

export {
  hydrateAuthStore,
  useAccessToken,
  useAuthStore,
  useAuthUser,
  useCustomerId,
  useIsAuthenticated,
  useRefreshToken,
};

export type { AuthSession, AuthUser };
