import * as SecureStore from "expo-secure-store";

import { canonicalCustomerId } from "@/helpers/auth/customerId";
import {
  getItem,
  setItem,
  type SecureStorageOptions,
} from "@/security/vault/secureStorage";

const CLINIC_REFRESH_PREFIX = "auth.refreshToken.clinic.v1.";

const DEVICE_ONLY_OPTIONS: SecureStorageOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function clinicRefreshKey(customerId: string): string | null {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return null;
  }
  return `${CLINIC_REFRESH_PREFIX}${id}`;
}

export async function persistClinicRefreshToken(
  customerId: string,
  token: string,
): Promise<void> {
  const key = clinicRefreshKey(customerId);
  if (!key || !token.trim()) {
    return;
  }
  await setItem(key, null);
  await setItem(key, token, DEVICE_ONLY_OPTIONS);
}

export async function readClinicRefreshToken(
  customerId: string,
): Promise<string | null> {
  const key = clinicRefreshKey(customerId);
  if (!key) {
    return null;
  }
  return getItem(key, DEVICE_ONLY_OPTIONS);
}

export async function clearClinicRefreshToken(
  customerId: string,
): Promise<void> {
  const key = clinicRefreshKey(customerId);
  if (!key) {
    return;
  }
  await setItem(key, null);
}
