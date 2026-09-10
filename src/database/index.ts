export { clinicDatabaseManager } from "./ClinicDatabaseManager";
export type { DemoteClinicResult } from "./ClinicDatabaseManager";
export {
  assertClinicSyncBinding,
  readAccessTokenCustomerId,
  type SynchronizeOptions,
} from "./assertClinicSyncBinding";
export {
  clearClinicRegistry,
  clinicHasSuccessfulSync,
  getClinicLastSuccessfulSyncAt,
  getOrCreateClinicRegistryEntry,
  isClinicWarm,
  listWarmClinicIds,
  listWarmClinicsByLru,
  loadClinicRegistry,
  markClinicCold,
  markClinicSynced,
  type ClinicRegistryEntry,
  type ClinicRegistryState,
} from "./ClinicRegistry";
export { clinicDbNameForCustomer, LEGACY_CLINIC_DB_NAME } from "./clinicDbNames";
export {
  isClinicSyncInFlight,
  waitForAllClinicSyncsIdle,
  waitForClinicSyncIdle,
} from "./clinicSyncLock";
export { getWarmClinicMetrics } from "./warmClinicMetrics";
export { resolveWarmClinicPolicy } from "./warmClinicPolicy";
