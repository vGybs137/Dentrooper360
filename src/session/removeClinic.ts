import type { QueryClient } from "@tanstack/react-query";

import { unpairClinic } from "@/api/functions/auth";
import { loadClinicRegistry } from "@/database/ClinicRegistry";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { waitForClinicSyncIdle } from "@/database/clinicSyncLock";
import { hasUnsyncedChanges, synchronize } from "@/database/synchronize";
import { sameCustomerId } from "@/helpers/auth/customerId";
import { getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import {
  clearClinicRefreshToken,
  readClinicRefreshToken,
} from "@/security/vault/clinicRefreshTokenVault";
import { activateClinicFromStoredRefresh } from "@/session/switchClinic";
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
  /**
   * True when the removed clinic was active and no other clinic session was
   * restored (caller should leave the authenticated app shell).
   */
  clearedActiveSession: boolean;
  /** Set when another clinic on this device was activated after remove. */
  switchedToCustomerId: string | null;
};

export type RemoveClinicOptions = {
  queryClient?: QueryClient;
};

type RemainingClinicCandidate = {
  customerId: string;
  lastOpenedAt: string | null;
};

function sortRemainingByRecent(
  clinics: RemainingClinicCandidate[],
): RemainingClinicCandidate[] {
  return [...clinics].sort((a, b) => {
    const aAt = a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0;
    const bAt = b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0;
    const aTime = Number.isFinite(aAt) ? aAt : 0;
    const bTime = Number.isFinite(bAt) ? bAt : 0;
    return bTime - aTime;
  });
}

async function pickNextClinic(
  removedCustomerId: string,
): Promise<{
  withSession: string | null;
  forLogin: string | null;
}> {
  const registry = await loadClinicRegistry();
  const remaining = sortRemainingByRecent(
    Object.values(registry.clinics)
      .filter((entry) => !sameCustomerId(entry.customerId, removedCustomerId))
      .map((entry) => ({
        customerId: entry.customerId,
        lastOpenedAt: entry.lastOpenedAt,
      })),
  );

  if (remaining.length === 0) {
    return { withSession: null, forLogin: null };
  }

  for (const clinic of remaining) {
    const refresh = await readClinicRefreshToken(clinic.customerId);
    if (refresh) {
      return { withSession: clinic.customerId, forLogin: clinic.customerId };
    }
  }

  return { withSession: null, forLogin: remaining[0]?.customerId ?? null };
}

/**
 * Unpairs a clinic on the server, then wipes the local SQLite file.
 * Never opens a Watermelon sync after local destruction — file unlink only —
 * so server PHI is not tombstoned from a local wipe.
 *
 * When the active clinic is removed and another clinic remains on device,
 * restores that clinic's session (or rebinds login to it). Otherwise clears
 * pairing so login cannot target the unpaired clinic.
 */
export async function removeClinic(
  customerId: string,
  options: RemoveClinicOptions = {},
): Promise<RemoveClinicResult> {
  const normalized = customerId.trim();
  if (!normalized) {
    throw new RemoveClinicError("INVALID_CUSTOMER", "customerId is required.");
  }

  await waitForClinicSyncIdle(normalized);

  const activeCustomerId = useAuthStore.getState().customerId;
  const isActive = Boolean(
    activeCustomerId && sameCustomerId(activeCustomerId, normalized),
  );

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

  const nextClinic = isActive ? await pickNextClinic(normalized) : null;

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

  await clearClinicRefreshToken(normalized);

  // File unlink only — do not call synchronize after this.
  await clinicDatabaseManager.deleteClinicData(normalized);

  if (!isActive) {
    return { clearedActiveSession: false, switchedToCustomerId: null };
  }

  const { clearSession, clearAllSecurityState } = await import(
    "@/security/session/sessionVault"
  );

  // Drop the unpaired clinic's session before handoff so persistSession cannot
  // re-vault its refresh token under the removed customer id.
  await clearSession();
  useAuthStore.getState().setCustomerId(null);

  if (nextClinic?.withSession) {
    try {
      await activateClinicFromStoredRefresh({
        targetCustomerId: nextClinic.withSession,
        queryClient: options.queryClient,
      });
      return {
        clearedActiveSession: false,
        switchedToCustomerId: nextClinic.withSession,
      };
    } catch {
      const { useClinicSwitchStore } = await import("@/stores");
      useClinicSwitchStore.getState().clearError();
      // Fall through to login rebind / full clear below.
    }
  }

  if (nextClinic?.forLogin) {
    useAuthStore.getState().setCustomerId(nextClinic.forLogin);
    try {
      await clinicDatabaseManager.setActive(nextClinic.forLogin);
    } catch {
      // Login can still target the rebound clinic id even if open fails here.
    }
    return { clearedActiveSession: true, switchedToCustomerId: null };
  }

  await clearAllSecurityState();
  return { clearedActiveSession: true, switchedToCustomerId: null };
}
