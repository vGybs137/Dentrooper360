import * as Device from "expo-device";

/** Low-end phones keep fewer warm clinic SQLite files. */
const LOW_END_TOTAL_MEMORY_BYTES = 3.5 * 1024 * 1024 * 1024;

export type WarmClinicPolicy = {
  maxWarmClinics: number;
  /** Soft floor: demote when free disk is below this (bytes). */
  minFreeDiskBytes: number;
};

/**
 * Device-class warm-clinic budget.
 * Defaults: max 3 warm clinics; low-end (≤ ~3.5GB RAM) max 2.
 */
export function resolveWarmClinicPolicy(): WarmClinicPolicy {
  const totalMemory = Device.totalMemory ?? null;
  const isLowEnd =
    typeof totalMemory === "number" &&
    totalMemory > 0 &&
    totalMemory <= LOW_END_TOTAL_MEMORY_BYTES;

  return {
    maxWarmClinics: isLowEnd ? 2 : 3,
    minFreeDiskBytes: isLowEnd
      ? 400 * 1024 * 1024
      : 250 * 1024 * 1024,
  };
}
