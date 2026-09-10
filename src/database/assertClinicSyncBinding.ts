import { useAuthStore } from "@/stores";
import { ApiError } from "@/types/api";

import { getOrCreateClinicRegistryEntry } from "./ClinicRegistry";
import { readAccessTokenCustomerId } from "./readAccessTokenCustomerId";

export type SynchronizeOptions = {
  /**
   * When true, allow syncing a clinic other than auth.customerId.
   * Reserved for future warm-clinic background sync with a clinic-scoped token.
   * Default false — foreground sync must match the active session.
   */
  allowBackgroundClinic?: boolean;
};

export { readAccessTokenCustomerId } from "./readAccessTokenCustomerId";

/**
 * Ensures sync target, auth session, JWT claim, and registry row all agree.
 * Throws before any network I/O on mismatch.
 */
export async function assertClinicSyncBinding(
  customerId: string,
  options: SynchronizeOptions = {},
): Promise<void> {
  const normalized = customerId.trim();
  if (!normalized) {
    throw new ApiError("customerId is required for sync.", 400);
  }

  const sessionCustomerId = useAuthStore.getState().customerId;
  if (!sessionCustomerId) {
    throw new ApiError("No active clinic session.", 401);
  }

  if (!options.allowBackgroundClinic && normalized !== sessionCustomerId) {
    throw new ApiError(
      "Refusing to sync a clinic that is not the active session.",
      403,
    );
  }

  const accessToken = useAuthStore.getState().accessToken;
  const jwtCustomerId = readAccessTokenCustomerId(accessToken);
  if (
    jwtCustomerId &&
    !options.allowBackgroundClinic &&
    jwtCustomerId !== normalized
  ) {
    throw new ApiError(
      "Session token clinic does not match the sync target.",
      403,
    );
  }

  const entry = await getOrCreateClinicRegistryEntry(normalized);
  if (entry.customerId !== normalized) {
    throw new ApiError("Clinic registry identity mismatch.", 500);
  }
}
