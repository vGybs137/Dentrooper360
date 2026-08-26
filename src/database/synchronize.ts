import {
  hasUnsyncedChanges as watermelonHasUnsyncedChanges,
  synchronize as watermelonSynchronize,
  type SyncDatabaseChangeSet,
} from "@nozbe/watermelondb/sync";

import { pullChanges, pushChanges } from "@/api/functions/sync";
import { MIGRATIONS_ENABLED_AT_VERSION } from "@/constants/sync";
import { canSyncOnCurrentNetwork } from "@/helpers/connectivity";
import { toPullMigration } from "@/helpers/sync";
import { hydrateSyncStatusStore, markSyncSucceeded, useSyncStatusStore } from "@/stores";
import { ApiError } from "@/types/api";
import type { MobilePushRequest } from "@/types/sync";

import database from ".";

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
}

let inFlight: Promise<void> | null = null;

export async function synchronize(customerId: string): Promise<void> {
  await assertSyncNetworkAllowed();

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      await runSynchronize(customerId);
    } catch {
      await runSynchronize(customerId);
    }
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function hasUnsyncedChanges(): Promise<boolean> {
  return watermelonHasUnsyncedChanges({ database });
}
