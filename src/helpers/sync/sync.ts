import { SYNC_TABLE_NAMES } from "@/constants/sync";
import schema from "@/database/schema";
import type {
  MobilePullMigration,
  MobilePullRequest,
  MobilePullResponse,
  MobilePushRequest,
  SyncTableChanges,
  SyncTableName,
} from "@/types/sync";

export type WireSyncTableChanges = {
  created?: Record<string, unknown>[];
  updated?: Record<string, unknown>[];
  deleted?: string[];
};

export type WireMobilePullResponse = {
  timestamp: number;
  changes?: Partial<Record<SyncTableName, WireSyncTableChanges>>;
};

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

  for (const table of SYNC_TABLE_NAMES) {
    mapped[table] = mapTableChanges(changes?.[table]);
  }

  return mapped;
}

export function toPullMigration(
  migration?: {
    from: number;
    tables: readonly string[];
    columns: readonly { table: string; columns: readonly string[] }[];
  } | null,
): MobilePullMigration | null {
  if (!migration) {
    return null;
  }

  return {
    from: migration.from,
    tables: [...migration.tables],
    columns: migration.columns.map((entry) => ({
      table: entry.table,
      columns: [...entry.columns],
    })),
  };
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
