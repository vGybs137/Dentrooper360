import * as SecureStore from "expo-secure-store";

import {
  getItem,
  setItem,
  type SecureStorageOptions,
} from "@/security/vault/secureStorage";

export const AUTH_REFRESH_TOKEN_KEY = "auth.refreshToken.v1";

const DEVICE_ONLY_OPTIONS: SecureStorageOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function biometricOptions(authenticationPrompt: string): SecureStorageOptions {
  return {
    requireAuthentication: true,
    authenticationPrompt,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

/**
 * Biometric-bound refresh token vault.
 * Access JWTs stay in memory only; this store never holds access tokens.
 */
export async function getBiometricRefreshToken(
  authenticationPrompt = "Unlock Dentrooper to continue",
  options?: { requireAuthentication?: boolean },
): Promise<string | null> {
  const requireAuthentication = options?.requireAuthentication !== false;
  return getItem(
    AUTH_REFRESH_TOKEN_KEY,
    requireAuthentication
      ? biometricOptions(authenticationPrompt)
      : DEVICE_ONLY_OPTIONS,
  );
}

export async function setBiometricRefreshToken(
  token: string,
  options?: { requireAuthentication?: boolean },
): Promise<void> {
  const requireAuthentication = options?.requireAuthentication !== false;
  await setItem(
    AUTH_REFRESH_TOKEN_KEY,
    token,
    requireAuthentication
      ? biometricOptions("Unlock Dentrooper to continue")
      : DEVICE_ONLY_OPTIONS,
  );
}

export async function clearBiometricRefreshToken(): Promise<void> {
  await setItem(AUTH_REFRESH_TOKEN_KEY, null);
}
