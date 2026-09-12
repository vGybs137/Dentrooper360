/**
 * Biometric unlock seam. Phase 5 binds refresh-token reads to SecureStore
 * `requireAuthentication` + LocalAuthentication.
 */
export type BiometricUnlockResult =
  | { status: "unlocked" }
  | { status: "unavailable" }
  | { status: "cancelled" }
  | { status: "failed"; message?: string };

export async function isBiometricUnlockAvailable(): Promise<boolean> {
  return false;
}

export async function unlockWithBiometrics(
  _promptMessage = "Unlock Dentrooper",
): Promise<BiometricUnlockResult> {
  return { status: "unavailable" };
}
