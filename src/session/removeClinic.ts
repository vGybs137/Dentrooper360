import { unpairClinic } from "@/api/functions/auth";
import { getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import { clearDeviceApiKey } from "@/security/pairing/pairingVault";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { waitForClinicSyncIdle } from "@/database/clinicSyncLock";
import { hasUnsyncedChanges } from "@/database/synchronize";
import { synchronize } from "@/database/synchronize";
import { useAuthStore } from "@/stores";
import { ApiError } from "@/types/api";

export class RemoveClinicError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RemoveClinicError";
    this.code = code;
  }
}

export type RemoveClinicResult = {
  /** True when the removed clinic was the active session (caller should route to login). */
  clearedActiveSession: boolean;
};

/**
 * Unpairs a clinic on the server, then wipes the local SQLite file.
 * Never opens a Watermelon sync after local destruction — file unlink only —
 * so server PHI is not tombstoned from a local wipe.
 */
export async function removeClinic(customerId: string): Promise<RemoveClinicResult> {
  const normalized = customerId.trim();
  if (!normalized) {
    throw new RemoveClinicError("INVALID_CUSTOMER", "customerId is required.");
  }

  await waitForClinicSyncIdle(normalized);

  const activeCustomerId = useAuthStore.getState().customerId;
  const isActive = activeCustomerId === normalized;

  if (isActive) {
    try {
      await synchronize(normalized);
    } catch {
      // Fall through to unsynced check; wipe still blocked if local changes remain.
    }
  }

  if (await hasUnsyncedChanges(normalized)) {
    throw new RemoveClinicError(
      "UNSYNCED_CHANGES",
      "Sync local changes before removing this clinic from the device.",
    );
  }

  const deviceId = await getOrCreateDeviceId();
  const refreshToken = useAuthStore.getState().refreshToken;

  try {
    await unpairClinic({
      customerId: normalized,
      deviceId,
      refreshToken: isActive ? refreshToken : null,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // Already unpaired server-side — still wipe local.
    } else {
      throw error;
    }
  }

  await clearDeviceApiKey(normalized);

  // File unlink only — do not call synchronize after this.
  await clinicDatabaseManager.deleteClinicData(normalized);

  let clearedActiveSession = false;
  if (isActive) {
    useAuthStore.getState().clearSession();
    clearedActiveSession = true;
  }

  return { clearedActiveSession };
}
