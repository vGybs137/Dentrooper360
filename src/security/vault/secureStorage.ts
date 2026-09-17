import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type SecureStorageOptions = {
  /** iOS keychain accessibility; ignored on Android/web. */
  keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
};

/**
 * Low-level secure key-value storage.
 * Secrets use `WHEN_UNLOCKED_THIS_DEVICE_ONLY` where noted.
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
    keychainAccessible: options.keychainAccessible,
  };
}

export async function getItem(
  key: string,
  options?: SecureStorageOptions,
): Promise<string | null> {
  if (!isNativeSecureStorageAvailable()) {
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
      sessionStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key, toSecureStoreOptions(options));
    return;
  }

  if (!isNativeSecureStorageAvailable()) {
    sessionStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value, toSecureStoreOptions(options));
}
