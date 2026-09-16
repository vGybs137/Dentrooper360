import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/queryKeys";
import { canonicalCustomerId } from "@/helpers/auth/customerId";
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
  const syncCustomerId = canonicalCustomerId(customerId) ?? "";
  const shouldSync =
    hasHydrated && Boolean(syncCustomerId) && isAuthenticated && sessionValid;

  return useQuery({
    queryKey: queryKeys.sync.startup(syncCustomerId),
    queryFn: async () => {
      try {
        await synchronize(syncCustomerId);
        return true;
      } catch (error) {
        console.error("[ClinicSync] Failed to prepare clinic data", error);
        throw error;
      }
    },
    enabled: shouldSync,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}
