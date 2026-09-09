/** Pre-Phase-1 WatermelonDB default when `dbName` was omitted. */
export const LEGACY_CLINIC_DB_NAME = "watermelon";

export function clinicDbNameForCustomer(customerId: string): string {
  const normalized = customerId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) {
    throw new Error("customerId is required to build a clinic database name.");
  }

  return `clinic_${normalized}`;
}
