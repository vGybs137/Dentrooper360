import { useQuery } from "@tanstack/react-query";

import { listClinics } from "@/api";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { queryKeys } from "@/constants/queryKeys";
import { useIsAuthenticated } from "@/stores";

export function useClinicsList() {
  const isAuthenticated = useIsAuthenticated();
  const enabled = isAuthenticated && isClinicSwitchEnabled();

  return useQuery({
    queryKey: queryKeys.auth.clinics,
    queryFn: listClinics,
    enabled,
  });
}
