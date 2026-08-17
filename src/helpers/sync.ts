import schema from "@/database/schema";
import type {
  MobilePullRequest,
  MobilePullResponse,
  MobilePushRequest,
  SyncTableChanges,
  SyncTableName,
} from "@/types/sync";
import { SYNC_TABLE_NAMES } from "@/types/sync";

export type WireSyncTableChanges = {
  created?: Record<string, unknown>[];
  updated?: Record<string, unknown>[];
  deleted?: string[];
};

export type WireMobilePullResponse = {
  timestamp: number;
  changes?: Partial<Record<SyncTableName, WireSyncTableChanges>>;
};

function isSyncTableName(table: string): table is SyncTableName {
  return (SYNC_TABLE_NAMES as readonly string[]).includes(table);
}

function mapTableChanges(changes?: WireSyncTableChanges): SyncTableChanges {
  return {
    created: changes?.created ?? [],
    updated: changes?.updated ?? [],
    deleted: changes?.deleted ?? [],
  };
}

export function mapPullChanges(
  changes: WireMobilePullResponse["changes"],
): MobilePullResponse["changes"] {
  const mapped: MobilePullResponse["changes"] = {};

  for (const [table, tableChanges] of Object.entries(changes ?? {})) {
    if (isSyncTableName(table)) {
      mapped[table] = mapTableChanges(tableChanges);
    }
  }

  return mapped;
}

export function toPullPayload(request: MobilePullRequest) {
  return {
    customer_id: request.customerId,
    last_pulled_at: request.lastPulledAt,
    schema_version: request.schemaVersion ?? schema.version,
    migration: request.migration,
  };
}

export function toPushPayload(request: MobilePushRequest) {
  return {
    customer_id: request.customerId,
    last_pulled_at: request.lastPulledAt,
    changes: request.changes,
  };
}
