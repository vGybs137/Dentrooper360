import { useMutation } from "@tanstack/react-query";

import { pairDevice } from "@/api";
import type { PairRequest } from "@/types/auth";

export type PairMutationInput = PairRequest & {
  /** When false, register the clinic without making it the active session (add-clinic). */
  activate?: boolean;
};

export function usePairMutation() {
  return useMutation({
    mutationFn: ({ activate, ...request }: PairMutationInput) =>
      pairDevice(request, { activate }),
  });
}
