import { useQuery } from "@tanstack/react-query";

import { getCurrentUser, refreshSession } from "@/api";
import { queryKeys } from "@/constants/queryKeys";
import {
  useAuthStore,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";
import { ApiError } from "@/types/api";

async function validateSession() {
  try {
    const user = await getCurrentUser();
    useAuthStore.getState().setUser(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await refreshSession();
      const user = await getCurrentUser();
      useAuthStore.getState().setUser(user);
      return user;
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
