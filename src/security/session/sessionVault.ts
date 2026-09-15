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
} from "@/security/biometric/biometricUnlock";
import type { AuthSession, AuthUser } from "@/types/auth";

/**
 * Session vault facade.
 * Access token: memory only. Refresh: biometric SecureStore + memory cache.
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
    refreshBoundToBiometrics: state.refreshBoundToBiometrics,
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
