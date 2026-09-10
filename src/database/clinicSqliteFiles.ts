import { Platform } from "react-native";
import {
  deleteAsync,
  documentDirectory,
  getFreeDiskStorageAsync,
} from "expo-file-system/legacy";

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

function sidecarUris(dbUri: string): string[] {
  return [`${dbUri}-wal`, `${dbUri}-shm`, `${dbUri}-journal`];
}

/** Deletes the clinic SQLite file and WAL/SHM sidecars. Idempotent. */
export async function deleteClinicSqliteFiles(dbName: string): Promise<void> {
  const dbUri = clinicSqliteFileUri(dbName);
  const targets = [dbUri, ...sidecarUris(dbUri)];

  for (const uri of targets) {
    try {
      await deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.warn(`[ClinicSqlite] Failed to delete ${uri}`, error);
    }
  }
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
