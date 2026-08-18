import {
  hasUnsyncedChanges as watermelonHasUnsyncedChanges,
  synchronize as watermelonSynchronize,
  type SyncDatabaseChangeSet,
} from "@nozbe/watermelondb/sync";

import { pullChanges, pushChanges } from "@/api";
import { MIGRATIONS_ENABLED_AT_VERSION } from "@/constants/sync";
import { toPullMigration } from "@/helpers/sync";
import type { MobilePushRequest } from "@/types/sync";

import database from ".";

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
  });
}

let inFlight: Promise<void> | null = null;

export async function synchronize(customerId: string): Promise<void> {
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
