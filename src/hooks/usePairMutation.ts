import { useMutation } from "@tanstack/react-query";

import { pairDevice } from "@/api";
import type { PairRequest } from "@/types/auth";

export function usePairMutation() {
  return useMutation({
    mutationFn: (request: PairRequest) => pairDevice(request),
  });
}
