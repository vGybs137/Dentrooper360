import { useQuery } from "@tanstack/react-query";

import { getCurrentUser, refreshSession } from "@/api";
import { queryKeys } from "@/constants/queryKeys";
import { isNetworkError } from "@/helpers/sync/networkError";
import {
  useAuthStore,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";
import { ApiError } from "@/types/api";
import type { AuthUser } from "@/types/auth";

function cachedUserOrThrow(error: unknown): AuthUser {
  const cached = useAuthStore.getState().user;
  if (cached) {
    return cached;
  }

  throw error;
}

async function validateSession(): Promise<AuthUser> {
  try {
    const user = await getCurrentUser();
    useAuthStore.getState().setUser(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        await refreshSession();
        const user = await getCurrentUser();
        useAuthStore.getState().setUser(user);
        return user;
      } catch (refreshError) {
        if (isNetworkError(refreshError)) {
          return cachedUserOrThrow(refreshError);
        }

        throw refreshError;
      }
    }

    if (isNetworkError(error)) {
      return cachedUserOrThrow(error);
    }

    throw error;
  }
}

export function useStartupSessionCheck() {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const isAuthenticated = useIsAuthenticated();
  const shouldValidate = hasHydrated && Boolean(customerId) && isAuthenticated;

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: validateSession,
    enabled: shouldValidate,
  });
}
