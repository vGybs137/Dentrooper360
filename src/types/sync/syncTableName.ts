export const SYNC_TABLE_NAMES = [
  "appointment_types",
  "locations",
  "patients",
  "appointments",
  "services",
  "payments",
  "recalls",
] as const;

export type SyncTableName = (typeof SYNC_TABLE_NAMES)[number];
