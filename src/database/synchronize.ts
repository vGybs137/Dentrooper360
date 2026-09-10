import {
  hasUnsyncedChanges as watermelonHasUnsyncedChanges,
  synchronize as watermelonSynchronize,
  type SyncDatabaseChangeSet,
} from "@nozbe/watermelondb/sync";

import { pullChanges, pushChanges } from "@/api/functions/sync";
import { MIGRATIONS_ENABLED_AT_VERSION } from "@/constants/sync";
import {
  isSyncScopeProviderPanelEnabled,
} from "@/constants/multiClinicFlags";
import { canSyncOnCurrentNetwork } from "@/helpers/sync/connectivity";
import { toPullMigration } from "@/helpers/sync/sync";
import {
  hydrateSyncStatusStore,
  markSyncSucceeded,
  useSyncStatusStore,
} from "@/stores";
import { ApiError } from "@/types/api";
import type { MobilePushRequest } from "@/types/sync";

import {
  assertClinicSyncBinding,
  type SynchronizeOptions,
} from "./assertClinicSyncBinding";
import { clinicDatabaseManager } from "./ClinicDatabaseManager";
import { markClinicSynced } from "./ClinicRegistry";
import {
  clearClinicSyncInFlight,
  getClinicSyncInFlight,
  setClinicSyncInFlight,
} from "./clinicSyncLock";

export const SYNC_WIFI_ONLY_MESSAGE =
  "Sync is limited to Wi-Fi. Connect to Wi-Fi or allow mobile data in Settings.";

export type { SynchronizeOptions };

async function assertSyncNetworkAllowed(): Promise<void> {
  await hydrateSyncStatusStore();
  const wifiOnly = useSyncStatusStore.getState().syncWifiOnly;
  const { allowed, reason } = await canSyncOnCurrentNetwork(wifiOnly);

  if (allowed) {
    return;
  }

  if (reason === "cellular") {
    throw new ApiError(SYNC_WIFI_ONLY_MESSAGE, 422);
  }

  throw new ApiError("Unable to reach the server.", 0);
}

function isMobilePushConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

/**
 * One pull+push cycle for a single clinic DB.
 * Never calls unsafeResetDatabase — conflicts must retry sync, not wipe.
 */
async function runSynchronizeOnce(
  customerId: string,
  options: SynchronizeOptions,
): Promise<void> {
  await assertClinicSyncBinding(customerId, options);
  const database = await clinicDatabaseManager.getOrOpen(customerId);

  let appliedSyncScope: string | null = null;
  let scopeVersion: number | null = null;

  await watermelonSynchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      await assertClinicSyncBinding(customerId, options);
      const response = await pullChanges({
        customerId,
        lastPulledAt: lastPulledAt ?? 0,
        schemaVersion,
        migration: toPullMigration(migration),
      });

      appliedSyncScope = response.appliedSyncScope ?? null;
      scopeVersion =
        typeof response.scopeVersion === "number" ? response.scopeVersion : null;

      return {
        changes: response.changes as SyncDatabaseChangeSet,
        timestamp: response.timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await assertClinicSyncBinding(customerId, options);
      await pushChanges({
        customerId,
        lastPulledAt,
        changes: changes as MobilePushRequest["changes"],
      });
    },
    migrationsEnabledAtVersion: MIGRATIONS_ENABLED_AT_VERSION,
  });

  const syncedAt = Date.now();
  const persistPanel = isSyncScopeProviderPanelEnabled();
  await markClinicSynced(
    customerId,
    new Date(syncedAt),
    persistPanel ? appliedSyncScope : "full_clinic",
    persistPanel ? scopeVersion : 1,
  );
  await hydrateSyncStatusStore();
  // UI store mirrors the active clinic only; registry remains per-clinic source of truth.
  if (clinicDatabaseManager.getActiveCustomerId() === customerId) {
    markSyncSucceeded(syncedAt);
  }
}

async function runSynchronizeWithRetries(
  customerId: string,
  options: SynchronizeOptions,
): Promise<void> {
  try {
    await runSynchronizeOnce(customerId, options);
  } catch (error) {
    if (isMobilePushConflict(error)) {
      // 409: another writer won. Pull then push again for THIS clinic only.
      // Do not switch clinics and never reset the local DB.
      await runSynchronizeOnce(customerId, options);
      return;
    }

    // Transient failure: one generic retry for the same clinic.
    await runSynchronizeOnce(customerId, options);
  }
}

export async function synchronize(
  customerId: string,
  options: SynchronizeOptions = {},
): Promise<void> {
  const normalized = customerId.trim();

  await assertClinicSyncBinding(normalized, options);

  if (options.allowBackgroundClinic) {
    await clinicDatabaseManager.getOrOpen(normalized);
  } else {
    // Foreground: open and set active before network gate (offline enter still works
    // when callers only need ensureActive — sync itself requires network after this).
    await clinicDatabaseManager.ensureActive(normalized);
  }

  await assertSyncNetworkAllowed();

  const existing = getClinicSyncInFlight(normalized);
  if (existing) {
    return existing;
  }

  const inFlight = (async () => {
    await runSynchronizeWithRetries(normalized, options);
  })().finally(() => {
    clearClinicSyncInFlight(normalized, inFlight);
  });

  setClinicSyncInFlight(normalized, inFlight);
  return inFlight;
}

export async function hasUnsyncedChanges(
  customerId?: string | null,
): Promise<boolean> {
  if (customerId) {
    return clinicDatabaseManager.hasUnsyncedChanges(customerId);
  }

  const active = clinicDatabaseManager.tryGetActive();
  if (!active) {
    return false;
  }

  return watermelonHasUnsyncedChanges({ database: active });
}

export {
  isClinicSyncInFlight,
  waitForAllClinicSyncsIdle,
  waitForClinicSyncIdle,
} from "./clinicSyncLock";
