import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";

import { queryKeys } from "@/constants/queryKeys";
import { ClinicSwitchError, switchClinic } from "@/session/switchClinic";
import { ApiError } from "@/types/api";

export function useSwitchClinicMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (targetCustomerId: string) =>
      switchClinic({ targetCustomerId, queryClient }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.clinics });
      // Drop patient/appointment detail stacks from the previous clinic.
      router.replace("/(tabs)/schedule" as Href);
    },
  });
}

export function switchClinicErrorMessage(error: unknown): string {
  if (error instanceof ClinicSwitchError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unable to switch clinics. Please try again.";
}
