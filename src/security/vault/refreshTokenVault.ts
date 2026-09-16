import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "@/stores/authStore";
import {
  getItem,
  setItem,
  type SecureStorageOptions,
} from "@/security/vault/secureStorage";

export const AUTH_REFRESH_TOKEN_KEY = "auth.refreshToken.v1";

/** Leftover from biometric login. Deleted, never read (a read would prompt). */
const LEGACY_BIOMETRIC_KEY = "auth.biometricKey.v1";
const WRAPPED_REFRESH_PREFIX = "enc.v1:";

const DEVICE_ONLY_OPTIONS: SecureStorageOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function deleteLegacyBiometricKey(): Promise<void> {
  try {
    await setItem(LEGACY_BIOMETRIC_KEY, null);
  } catch {
    // Already gone, or stored behind a prompt we must not trigger.
  }
}

export async function readStoredRefreshToken(): Promise<string | null> {
  const value = await getItem(AUTH_REFRESH_TOKEN_KEY, DEVICE_ONLY_OPTIONS);
  if (!value || value.startsWith(WRAPPED_REFRESH_PREFIX)) {
    return null;
  }

  return value;
}

export async function persistRefreshTokenSecurely(token: string): Promise<void> {
  useAuthStore.getState().setRefreshToken(token);
  useAuthStore.getState().setHasRefreshCredential(true);
  await setItem(AUTH_REFRESH_TOKEN_KEY, null);
  await setItem(AUTH_REFRESH_TOKEN_KEY, token, DEVICE_ONLY_OPTIONS);
  await deleteLegacyBiometricKey();
}

export async function clearRefreshTokenSecurely(): Promise<void> {
  await setItem(AUTH_REFRESH_TOKEN_KEY, null);
  await deleteLegacyBiometricKey();
  useAuthStore.getState().setRefreshToken(null);
  useAuthStore.getState().setHasRefreshCredential(false);
}
