import { useEffect } from "react";

import {
  startConnectivitySync,
  stopConnectivitySync,
} from "@/services/connectivitySync";
import { useCustomerId, useHasHydrated, useIsAuthenticated } from "@/stores";

export function useConnectivitySync() {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!hasHydrated || !customerId || !isAuthenticated) {
      stopConnectivitySync();
      return;
    }

    startConnectivitySync(customerId);

    return () => {
      stopConnectivitySync();
    };
  }, [customerId, hasHydrated, isAuthenticated]);
}
