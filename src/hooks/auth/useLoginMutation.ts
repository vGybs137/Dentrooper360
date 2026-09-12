import { useMutation } from "@tanstack/react-query";

import { login } from "@/api";
import { t } from "@/i18n";
import { ApiError } from "@/types/api";

export function useLoginMutation(customerId: string | null | undefined) {
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) => {
      if (!customerId) {
        throw new ApiError(t("auth:login.error.pairRequired"), 400);
      }

      return login({
        customerId,
        username: credentials.username,
        password: credentials.password,
      });
    },
  });
}
