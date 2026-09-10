import { useEffect } from "react";

import { startPeriodicSync, stopPeriodicSync } from "@/services/periodicSync";
import {
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
  useIsSwitchingClinic,
} from "@/stores";

export function usePeriodicSync() {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const isAuthenticated = useIsAuthenticated();
  const isSwitchingClinic = useIsSwitchingClinic();

  useEffect(() => {
    if (
      !hasHydrated ||
      !customerId ||
      !isAuthenticated ||
      isSwitchingClinic
    ) {
      stopPeriodicSync();
      return;
    }

    startPeriodicSync(customerId);

    return () => {
      stopPeriodicSync();
    };
  }, [customerId, hasHydrated, isAuthenticated, isSwitchingClinic]);
}
