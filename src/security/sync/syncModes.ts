/**
 * Mobile sync always requires a JWT after login.
 * There is no pre-login / pairing bootstrap catalog sync mode.
 */
export enum MobileSyncMode {
  /** Full clinical Watermelon sync after login (Bearer JWT). */
  FullClinical = "full_clinical",
}

export function resolveMobileSyncMode(isAuthenticated: boolean): MobileSyncMode {
  if (!isAuthenticated) {
    throw new Error("Mobile sync requires an authenticated session.");
  }

  return MobileSyncMode.FullClinical;
}
