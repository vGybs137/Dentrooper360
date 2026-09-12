export {
  clearDeviceId,
  getDeviceInfo,
  getOrCreateDeviceId,
} from "@/helpers/auth/deviceId";

import { getSessionSnapshot, setPairedCustomerId } from "@/security/session/sessionVault";

/** Current paired clinic customer id (device binding), if any. */
export function getPairedCustomerId(): string | null {
  return getSessionSnapshot().customerId;
}

export { setPairedCustomerId };
