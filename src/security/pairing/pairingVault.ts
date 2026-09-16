import { canonicalCustomerId } from "@/helpers/auth/customerId";
import {
  clearDeviceId,
  getDeviceInfo,
  getOrCreateDeviceId,
} from "@/helpers/auth/deviceId";

import { getSessionSnapshot, setPairedCustomerId } from "@/security/session/sessionVault";

export { clearDeviceId, getDeviceInfo, getOrCreateDeviceId };
import * as SecureStore from "expo-secure-store";

const DEVICE_API_KEY_PREFIX = "dentrooper.deviceApiKey.";

/** Current paired clinic customer id (device binding), if any. */
export function getPairedCustomerId(): string | null {
  return getSessionSnapshot().customerId;
}

export { setPairedCustomerId };

function deviceApiKeyName(customerId: string): string | null {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return null;
  }

  return `${DEVICE_API_KEY_PREFIX}${id}`;
}

export async function storeDeviceApiKey(
  customerId: string,
  deviceApiKey: string,
): Promise<void> {
  const name = deviceApiKeyName(customerId);
  if (!name) {
    return;
  }

  await SecureStore.setItemAsync(name, deviceApiKey);
}

export async function getDeviceApiKey(customerId: string): Promise<string | null> {
  const name = deviceApiKeyName(customerId);
  if (!name) {
    return null;
  }

  return SecureStore.getItemAsync(name);
}

export async function clearDeviceApiKey(customerId: string): Promise<void> {
  const name = deviceApiKeyName(customerId);
  if (!name) {
    return;
  }

  await SecureStore.deleteItemAsync(name);
}
