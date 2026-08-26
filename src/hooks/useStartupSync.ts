import { useQuery } from "@tanstack/react-query";

import { BYPASS_AUTH } from "@/constants/auth";
import { queryKeys } from "@/constants/queryKeys";
import { synchronize } from "@/database/synchronize";
import {
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";

export function useStartupSync(sessionValid: boolean) {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const isAuthenticated = useIsAuthenticated();
  const shouldSync =
    hasHydrated && Boolean(customerId) && isAuthenticated && sessionValid;

  return useQuery({
    queryKey: queryKeys.sync.startup(customerId ?? ""),
    queryFn: async () => {
      // AUTH BYPASSED: skip API sync so startup can finish offline.
      if (BYPASS_AUTH) {
        return true;
      }

      await synchronize(customerId!);
      return true;
    },
    enabled: shouldSync,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}
