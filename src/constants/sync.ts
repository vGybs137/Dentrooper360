export const SYNC_MOBILE_PULL_PATH = "/api/sync/mobile/pull";
export const SYNC_MOBILE_PUSH_PATH = "/api/sync/mobile/push";

export const MIGRATIONS_ENABLED_AT_VERSION = 1;

export const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Debounce for sync triggered after local appointment writes. */
export const SYNC_AFTER_WRITE_DEBOUNCE_MS = 2500;

export const SYNC_TABLE_NAMES = [
  "appointment_types",
  "locations",
  "provider_working_hours",
  "patients",
  "appointments",
  "services",
  "payments",
  "recalls",
] as const;
