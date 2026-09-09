import type { Database } from "@nozbe/watermelondb";

import { clinicDatabaseManager } from "./ClinicDatabaseManager";

export { clinicDatabaseManager } from "./ClinicDatabaseManager";
export {
  clearClinicRegistry,
  getOrCreateClinicRegistryEntry,
  loadClinicRegistry,
  markClinicSynced,
  type ClinicRegistryEntry,
  type ClinicRegistryState,
} from "./ClinicRegistry";
export { clinicDbNameForCustomer, LEGACY_CLINIC_DB_NAME } from "./clinicDbNames";

/**
 * Compatibility proxy for existing `import database from "@/database"` call sites.
 * Forwards to the active clinic Database after `clinicDatabaseManager.ensureActive`.
 */
const database = new Proxy({} as Database, {
  get(_target, property, _receiver) {
    const active = clinicDatabaseManager.requireActive();
    const value = Reflect.get(active, property, active);
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as Database;

export default database;
