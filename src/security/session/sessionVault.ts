import {
  hydrateAuthStore,
  useAccessToken,
  useAuthStore,
  useAuthUser,
  useCanUnlockSession,
  useCustomerId,
  useHasRefreshCredential,
  useIsAuthenticated,
  useRefreshToken,
} from "@/stores/authStore";
import {
  clearRefreshTokenSecurely,
  persistRefreshTokenSecurely,
} from "@/security/vault/refreshTokenVault";
import type { AuthSession, AuthUser } from "@/types/auth";

/**
 * Session vault facade.
 * Access token: memory only. Refresh: device-only SecureStore, cached in memory after login.
 */
export function getSessionSnapshot() {
  const state = useAuthStore.getState();
  return {
    user: state.user,
    customerId: state.customerId,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    expiresAt: state.expiresAt,
    hasRefreshCredential: state.hasRefreshCredential,
  };
}

export async function setSession(session: AuthSession): Promise<void> {
  useAuthStore.getState().setSession(session);
  await persistRefreshTokenSecurely(session.refreshToken);
}

export async function clearSession(): Promise<void> {
  await clearRefreshTokenSecurely();
  useAuthStore.getState().clearSession();
}

export async function clearAllSecurityState(): Promise<void> {
  await clearRefreshTokenSecurely();
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
  useCanUnlockSession,
  useCustomerId,
  useHasRefreshCredential,
  useIsAuthenticated,
  useRefreshToken,
};

export type { AuthSession, AuthUser };
