import { useEffect } from "react";

import {
  startTokenRefreshService,
  stopTokenRefreshService,
} from "@/services/tokenRefresh";
import { useHasHydrated, useIsAuthenticated } from "@/stores";

export function useTokenRefresh() {
  const hasHydrated = useHasHydrated();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      stopTokenRefreshService();
      return;
    }

    startTokenRefreshService();

    return () => {
      stopTokenRefreshService();
    };
  }, [hasHydrated, isAuthenticated]);
}
