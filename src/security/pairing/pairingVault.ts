export {
  clearDeviceId,
  getDeviceInfo,
  getOrCreateDeviceId,
} from "@/helpers/auth/deviceId";

import { getSessionSnapshot, setPairedCustomerId } from "@/security/session/sessionVault";
import * as SecureStore from "expo-secure-store";

const DEVICE_API_KEY_PREFIX = "dentrooper.deviceApiKey.";

/** Current paired clinic customer id (device binding), if any. */
export function getPairedCustomerId(): string | null {
  return getSessionSnapshot().customerId;
}

export { setPairedCustomerId };

export async function storeDeviceApiKey(
  customerId: string,
  deviceApiKey: string,
): Promise<void> {
  await SecureStore.setItemAsync(`${DEVICE_API_KEY_PREFIX}${customerId}`, deviceApiKey);
}

export async function getDeviceApiKey(customerId: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${DEVICE_API_KEY_PREFIX}${customerId}`);
}

export async function clearDeviceApiKey(customerId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${DEVICE_API_KEY_PREFIX}${customerId}`);
}
