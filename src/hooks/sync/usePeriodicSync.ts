import { useEffect } from "react";

import { startPeriodicSync, stopPeriodicSync } from "@/services/periodicSync";
import { useCustomerId, useHasHydrated, useIsAuthenticated } from "@/stores";

export function usePeriodicSync() {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!hasHydrated || !customerId || !isAuthenticated) {
      stopPeriodicSync();
      return;
    }

    startPeriodicSync(customerId);

    return () => {
      stopPeriodicSync();
    };
  }, [customerId, hasHydrated, isAuthenticated]);
}
