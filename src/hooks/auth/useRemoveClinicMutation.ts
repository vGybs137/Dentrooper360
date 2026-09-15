import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";

import { queryKeys } from "@/constants/queryKeys";
import {
  RemoveClinicError,
  removeClinic,
} from "@/session/removeClinic";

export function removeClinicErrorMessage(error: unknown): string {
  if (error instanceof RemoveClinicError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to remove this clinic from the device.";
}

export function useRemoveClinicMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (customerId: string) => removeClinic(customerId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.clinics });
      if (result.clearedActiveSession) {
        router.replace("/(auth)/login" as Href);
      }
    },
  });
}
