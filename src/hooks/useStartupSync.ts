import { useQuery } from "@tanstack/react-query";

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
    queryFn: () => synchronize(customerId!),
    enabled: shouldSync,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}
