import { Platform } from "react-native";
import {
  deleteAsync,
  documentDirectory,
  getFreeDiskStorageAsync,
  readDirectoryAsync,
} from "expo-file-system/legacy";

import { loadClinicRegistry } from "@/database/ClinicRegistry";
import { LEGACY_CLINIC_DB_NAME } from "@/database/clinicDbNames";
import { getItem, setItem } from "@/security/vault/secureStorage";
import { useAuthStore } from "@/stores";

const PENDING_SQLITE_DELETES_KEY = "clinic.pendingSqliteDeletes.v1";

/**
 * Resolves the on-disk URI for a WatermelonDB SQLite file (JSI adapter).
 * iOS: Documents/{dbName}.db
 * Android JSI: strips "/databases" from Context.getDatabasePath → app data root.
 */
export function clinicSqliteFileUri(dbName: string): string {
  const name = dbName.trim();
  if (!name) {
    throw new Error("dbName is required");
  }

  if (Platform.OS === "ios") {
    const root = documentDirectory ?? "";
    return `${root}${name}.db`;
  }

  if (Platform.OS === "android") {
    const docs = documentDirectory ?? "";
    // file:///data/user/0/<pkg>/files/ → file:///data/user/0/<pkg>/
    const appRoot = docs.replace(/files\/?$/, "");
    return `${appRoot}${name}.db`;
  }

  // Web / unknown: best-effort under documentDirectory.
  const root = documentDirectory ?? "";
  return `${root}${name}.db`;
}

function clinicSqliteAppRoot(): string {
  if (Platform.OS === "android") {
    const docs = documentDirectory ?? "";
    return docs.replace(/files\/?$/, "");
  }
  return documentDirectory ?? "";
}

function sidecarUris(dbUri: string): string[] {
  return [`${dbUri}-wal`, `${dbUri}-shm`, `${dbUri}-journal`];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryDeleteUri(uri: string): Promise<boolean> {
  try {
    await deleteAsync(uri, { idempotent: true });
    return true;
  } catch {
    return false;
  }
}

/** Deletes the clinic SQLite file and WAL/SHM sidecars. Returns false if any target stayed locked. */
export async function deleteClinicSqliteFiles(dbName: string): Promise<boolean> {
  const dbUri = clinicSqliteFileUri(dbName);
  const targets = [dbUri, ...sidecarUris(dbUri)];
  let allDeleted = true;

  for (const uri of targets) {
    let deleted = await tryDeleteUri(uri);
    if (!deleted) {
      // File often stays locked briefly after unsafeClose / process handoff.
      for (const waitMs of [50, 150, 400]) {
        await delay(waitMs);
        deleted = await tryDeleteUri(uri);
        if (deleted) {
          break;
        }
      }
    }

    if (!deleted) {
      allDeleted = false;
      console.warn(`[ClinicSqlite] Failed to delete ${uri} (still locked)`);
    }
  }

  return allDeleted;
}

async function readPendingDeletes(): Promise<string[]> {
  const raw = await getItem(PENDING_SQLITE_DELETES_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
  } catch {
    return [];
  }
}

async function writePendingDeletes(dbNames: string[]): Promise<void> {
  const unique = [
    ...new Set(dbNames.map((name) => name.trim()).filter(Boolean)),
  ];
  if (unique.length === 0) {
    await setItem(PENDING_SQLITE_DELETES_KEY, null);
    return;
  }
  await setItem(PENDING_SQLITE_DELETES_KEY, JSON.stringify(unique));
}

/** Remember SQLite files that could not be unlinked while a connection held them. */
export async function queuePendingClinicSqliteDeletes(
  dbNames: readonly string[],
): Promise<void> {
  const existing = await readPendingDeletes();
  await writePendingDeletes([...existing, ...dbNames]);
}

function isClinicSqliteFileName(name: string): boolean {
  return (
    name === `${LEGACY_CLINIC_DB_NAME}.db` ||
    name.startsWith(`${LEGACY_CLINIC_DB_NAME}.db-`) ||
    /^clinic_[a-z0-9]+\.db(?:-wal|-shm|-journal)?$/i.test(name)
  );
}

/**
 * When unpaired with an empty registry, remove leftover clinic SQLite files from
 * failed prior wipes (process restart usually releases Android file locks).
 */
async function deleteOrphanedClinicSqliteFiles(): Promise<void> {
  if (useAuthStore.getState().customerId) {
    return;
  }

  const registry = await loadClinicRegistry();
  if (Object.keys(registry.clinics).length > 0) {
    return;
  }

  const root = clinicSqliteAppRoot();
  if (!root) {
    return;
  }

  try {
    const entries = await readDirectoryAsync(root);
    for (const name of entries) {
      if (!isClinicSqliteFileName(name)) {
        continue;
      }
      await tryDeleteUri(`${root}${name}`);
    }
  } catch (error) {
    console.warn("[ClinicSqlite] Orphan scan failed", error);
  }
}

/**
 * Best-effort unlink of SQLite files queued from a previous wipe/remove.
 * Call on cold start before any clinic database is opened.
 */
export async function flushPendingClinicSqliteDeletes(): Promise<void> {
  const pending = await readPendingDeletes();
  const stillPending: string[] = [];
  for (const dbName of pending) {
    const deleted = await deleteClinicSqliteFiles(dbName);
    if (!deleted) {
      stillPending.push(dbName);
    }
  }
  await writePendingDeletes(stillPending);
  await deleteOrphanedClinicSqliteFiles();
}

/** Free disk bytes, or null when unavailable (web / unsupported). */
export async function getFreeDiskBytes(): Promise<number | null> {
  try {
    const bytes = await getFreeDiskStorageAsync();
    return typeof bytes === "number" && Number.isFinite(bytes) ? bytes : null;
  } catch {
    return null;
  }
}
