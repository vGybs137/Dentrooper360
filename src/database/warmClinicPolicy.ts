/** Low-end phones keep fewer warm clinic SQLite files. */
export const LOW_END_TOTAL_MEMORY_BYTES = 3.5 * 1024 * 1024 * 1024;

export type WarmClinicPolicy = {
  maxWarmClinics: number;
  /** Soft floor: demote when free disk is below this (bytes). */
  minFreeDiskBytes: number;
};

function readDeviceTotalMemory(): number | null {
  try {
    // Lazy require keeps Node unit tests free of expo-device.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require("expo-device") as { totalMemory?: number | null };
    return Device.totalMemory ?? null;
  } catch {
    return null;
  }
}

/**
 * Device-class warm-clinic budget.
 * Defaults: max 3 warm clinics; low-end (≤ ~3.5GB RAM) max 2.
 * Pass `totalMemoryBytes` to unit-test without expo-device.
 */
export function resolveWarmClinicPolicy(
  totalMemoryBytes?: number | null,
): WarmClinicPolicy {
  const memory =
    totalMemoryBytes === undefined ? readDeviceTotalMemory() : totalMemoryBytes;
  const isLowEnd =
    typeof memory === "number" &&
    memory > 0 &&
    memory <= LOW_END_TOTAL_MEMORY_BYTES;

  return {
    maxWarmClinics: isLowEnd ? 2 : 3,
    minFreeDiskBytes: isLowEnd
      ? 400 * 1024 * 1024
      : 250 * 1024 * 1024,
  };
}
