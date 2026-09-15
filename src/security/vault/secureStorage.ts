import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type SecureStorageOptions = {
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
  /** iOS keychain accessibility; ignored on Android/web. */
  keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
};

/**
 * Low-level secure key-value storage.
 * Auth refresh tokens use biometric `requireAuthentication` +
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Other prefs may use plain SecureStore.
 *
 * Production web builds do not persist secrets (native-only product).
 */
export function isNativeSecureStorageAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

function toSecureStoreOptions(
  options?: SecureStorageOptions,
): SecureStore.SecureStoreOptions | undefined {
  if (!options) {
    return undefined;
  }

  return {
    requireAuthentication: options.requireAuthentication,
    authenticationPrompt: options.authenticationPrompt,
    keychainAccessible: options.keychainAccessible,
  };
}

function assertNativeForSecrets(options?: SecureStorageOptions): void {
  if (isNativeSecureStorageAvailable()) {
    return;
  }

  // Token vault uses requireAuthentication; block that on web.
  // Non-secret prefs may still use sessionStorage for local web tooling.
  if (options?.requireAuthentication) {
    throw new Error("Secure token storage is only supported on iOS and Android.");
  }
}

export async function getItem(
  key: string,
  options?: SecureStorageOptions,
): Promise<string | null> {
  if (!isNativeSecureStorageAvailable()) {
    assertNativeForSecrets(options);
    return sessionStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key, toSecureStoreOptions(options));
}

export async function setItem(
  key: string,
  value: string | null,
  options?: SecureStorageOptions,
): Promise<void> {
  if (value === null) {
    if (!isNativeSecureStorageAvailable()) {
      assertNativeForSecrets(options);
      sessionStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (!isNativeSecureStorageAvailable()) {
    assertNativeForSecrets(options);
    sessionStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value, toSecureStoreOptions(options));
}
