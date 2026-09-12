/**
 * Distinguishes pairing catalog sync from JWT-gated clinical sync.
 * Phase 3 wires bootstrap into the synchronize pipeline.
 */
export enum MobileSyncMode {
  /** Allowlisted providers/roles/persons after QR pair (API key). */
  BootstrapCatalog = "bootstrap_catalog",
  /** Full clinical Watermelon sync after login (Bearer JWT). */
  FullClinical = "full_clinical",
}

export function resolveMobileSyncMode(isAuthenticated: boolean): MobileSyncMode {
  return isAuthenticated
    ? MobileSyncMode.FullClinical
    : MobileSyncMode.BootstrapCatalog;
}
