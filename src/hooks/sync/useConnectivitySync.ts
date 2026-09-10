import { useEffect } from "react";

import {
  startConnectivitySync,
  stopConnectivitySync,
} from "@/services/connectivitySync";
import {
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
  useIsSwitchingClinic,
} from "@/stores";

export function useConnectivitySync() {
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
      stopConnectivitySync();
      return;
    }

    startConnectivitySync(customerId);

    return () => {
      stopConnectivitySync();
    };
  }, [customerId, hasHydrated, isAuthenticated, isSwitchingClinic]);
}
