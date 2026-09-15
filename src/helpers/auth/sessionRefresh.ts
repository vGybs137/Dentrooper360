import { refreshSession } from "@/api/functions/auth";
import {
  clearRefreshTokenSecurely,
  unlockWithBiometrics,
} from "@/security/biometric/biometricUnlock";
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

  let refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken && useAuthStore.getState().hasRefreshCredential) {
    const unlock = await unlockWithBiometrics(
      "Unlock Dentrooper to refresh your session",
    );
    if (unlock.status !== "unlocked") {
      throw new ApiError(t("errors:auth.sessionRefresh"), 401);
    }
    refreshToken = unlock.refreshToken;
  }

  if (!refreshToken) {
    throw new ApiError(t("errors:auth.sessionRefresh"), 401);
  }

  try {
    return await refreshSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearRefreshTokenSecurely();
      useAuthStore.getState().clearSession();
    }

    throw error;
  }
}

/**
 * Cold-start unlock: biometric read of refresh → mint access JWT.
 * Returns null when unlock is unavailable/cancelled so the caller can fall
 * back to password login.
 */
export async function unlockSessionWithBiometrics(
  promptMessage = "Unlock Dentrooper",
): Promise<AuthSession | null> {
  if (unlockPromise) {
    return unlockPromise;
  }

  unlockPromise = (async () => {
    await hydrateAuthStore();

    if (useAuthStore.getState().accessToken && useAuthStore.getState().user) {
      // Already unlocked in this process.
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

    const unlock = await unlockWithBiometrics(promptMessage);
    if (unlock.status !== "unlocked") {
      if (unlock.status === "missing" || unlock.status === "unavailable") {
        await clearRefreshTokenSecurely();
        useAuthStore.getState().clearSession();
      }
      return null;
    }

    try {
      return await refreshSession();
    } catch {
      await clearRefreshTokenSecurely();
      useAuthStore.getState().clearSession();
      return null;
    }
  })().finally(() => {
    unlockPromise = null;
  });

  return unlockPromise;
}
