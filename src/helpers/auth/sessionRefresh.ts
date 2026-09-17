import { refreshSession } from "@/api/functions/auth";
import { clearSession } from "@/security/session/sessionVault";
import { readStoredRefreshToken } from "@/security/vault/refreshTokenVault";
import { t } from "@/i18n";
import { hydrateAuthStore, useAuthStore } from "@/stores";
import { ApiError } from "@/types/api";
import type { AuthSession } from "@/types/auth";

let recyclePromise: Promise<AuthSession> | null = null;
let unlockPromise: Promise<AuthSession | null> | null = null;

export function isRecyclingTokens(): boolean {
  return recyclePromise !== null;
}

export async function recycleTokens(): Promise<AuthSession> {
  if (recyclePromise) {
    return recyclePromise;
  }

  recyclePromise = performSessionRefresh().finally(() => {
    recyclePromise = null;
  });

  return recyclePromise;
}

async function performSessionRefresh(): Promise<AuthSession> {
  await hydrateAuthStore();

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    throw new ApiError(t("errors:auth.sessionRefresh"), 401);
  }

  try {
    return await refreshSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
    }

    throw error;
  }
}

/**
 * Cold start: read the device-only refresh token and mint an access JWT.
 * Returns null when nothing usable is stored so the caller can show password login.
 */
export async function restoreSavedSession(): Promise<AuthSession | null> {
  if (unlockPromise) {
    return unlockPromise;
  }

  unlockPromise = (async () => {
    await hydrateAuthStore();

    if (useAuthStore.getState().accessToken && useAuthStore.getState().user) {
      return {
        accessToken: useAuthStore.getState().accessToken!,
        refreshToken: useAuthStore.getState().refreshToken ?? "",
        expiresAt: new Date(useAuthStore.getState().expiresAt ?? Date.now()),
        user: useAuthStore.getState().user!,
      };
    }

    if (!useAuthStore.getState().hasRefreshCredential) {
      return null;
    }

    const refreshToken = await readStoredRefreshToken();
    if (!refreshToken) {
      await clearSession();
      return null;
    }

    useAuthStore.getState().setRefreshToken(refreshToken);

    try {
      return await refreshSession();
    } catch {
      await clearSession();
      return null;
    }
  })().finally(() => {
    unlockPromise = null;
  });

  return unlockPromise;
}
