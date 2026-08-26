import { refreshSession } from "@/api/functions/auth";
import { hydrateAuthStore, useAuthStore } from "@/stores";
import { ApiError } from "@/types/api";
import type { AuthSession } from "@/types/auth";

let recyclePromise: Promise<AuthSession> | null = null;

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

  if (!useAuthStore.getState().refreshToken) {
    throw new ApiError("No refresh token is stored.", 401);
  }

  try {
    return await refreshSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw error;
  }
}
