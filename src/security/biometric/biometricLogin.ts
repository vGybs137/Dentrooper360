import { t } from "@/i18n";
import { restoreSavedSession } from "@/helpers/auth/sessionRefresh";
import { useAppLockStore } from "@/stores/appLockStore";
import type { AuthSession } from "@/types/auth";

import { authenticateDeviceOwner, canOfferBiometricLock } from "./deviceAuth";

/**
 * Fingerprint / Face ID gate, then the existing device-only session restore.
 * Cancelling does not clear the refresh token.
 */
export async function loginWithBiometrics(): Promise<AuthSession | null> {
  const unlocked = await authenticateDeviceOwner(t("auth:login.biometricPrompt"));
  if (!unlocked) {
    return null;
  }

  return restoreSavedSession();
}

/**
 * After a password login, ask once to use biometrics next time.
 * A cancel is remembered so the prompt does not repeat on every sign-in.
 */
export async function offerBiometricLogin(): Promise<void> {
  const store = useAppLockStore.getState();
  if (
    !store.hasHydrated ||
    store.biometricLoginEnabled ||
    store.biometricLoginDeclined
  ) {
    return;
  }

  if (!(await canOfferBiometricLock())) {
    store.setBiometricLoginDeclined(true);
    return;
  }

  const accepted = await authenticateDeviceOwner(
    t("auth:login.biometricEnablePrompt"),
  );
  if (accepted) {
    store.setBiometricLoginEnabled(true);
    return;
  }

  store.setBiometricLoginDeclined(true);
}
