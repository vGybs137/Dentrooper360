import {
  hasUnsyncedChanges as watermelonHasUnsyncedChanges,
  synchronize as watermelonSynchronize,
  type SyncDatabaseChangeSet,
} from "@nozbe/watermelondb/sync";

import { pullChanges, pushChanges } from "@/api/functions/sync";
import { MIGRATIONS_ENABLED_AT_VERSION } from "@/constants/sync";
import { canSyncOnCurrentNetwork } from "@/helpers/sync/connectivity";
import { toPullMigration } from "@/helpers/sync/sync";
import { hydrateSyncStatusStore, markSyncSucceeded, useSyncStatusStore } from "@/stores";
import { ApiError } from "@/types/api";
import type { MobilePushRequest } from "@/types/sync";

import { clinicDatabaseManager } from "./ClinicDatabaseManager";
import { markClinicSynced } from "./ClinicRegistry";

export const SYNC_WIFI_ONLY_MESSAGE =
  "Sync is limited to Wi-Fi. Connect to Wi-Fi or allow mobile data in Settings.";

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

async function runSynchronize(customerId: string): Promise<void> {
  const database = await clinicDatabaseManager.ensureActive(customerId);

  await watermelonSynchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const response = await pullChanges({
        customerId,
        lastPulledAt: lastPulledAt ?? 0,
        schemaVersion,
        migration: toPullMigration(migration),
      });

      return {
        changes: response.changes as SyncDatabaseChangeSet,
        timestamp: response.timestamp,
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await pushChanges({
        customerId,
        lastPulledAt,
        changes: changes as MobilePushRequest["changes"],
      });
    },
    migrationsEnabledAtVersion: MIGRATIONS_ENABLED_AT_VERSION,
    // Backend incremental pulls send new client-id rows as "updated" so the creating
    // device does not conflict; other devices still create missing rows via this flag.
    // sendCreatedAsUpdated: true,
  });

  await hydrateSyncStatusStore();
  markSyncSucceeded();
  await markClinicSynced(customerId);
}

/** In-flight syncs keyed by clinic so callers never join another customer’s run. */
const inFlightByCustomerId = new Map<string, Promise<void>>();

export async function synchronize(customerId: string): Promise<void> {
  // Open/migrate the clinic DB before the network gate so offline continue still works.
  await clinicDatabaseManager.ensureActive(customerId);
  await assertSyncNetworkAllowed();

  const existing = inFlightByCustomerId.get(customerId);
  if (existing) {
    return existing;
  }

  const inFlight = (async () => {
    try {
      await runSynchronize(customerId);
    } catch {
      await runSynchronize(customerId);
    }
  })().finally(() => {
    if (inFlightByCustomerId.get(customerId) === inFlight) {
      inFlightByCustomerId.delete(customerId);
    }
  });

  inFlightByCustomerId.set(customerId, inFlight);
  return inFlight;
}

export async function hasUnsyncedChanges(customerId?: string | null): Promise<boolean> {
  if (customerId) {
    return clinicDatabaseManager.hasUnsyncedChanges(customerId);
  }

  const active = clinicDatabaseManager.tryGetActive();
  if (!active) {
    return false;
  }

  return watermelonHasUnsyncedChanges({ database: active });
}
