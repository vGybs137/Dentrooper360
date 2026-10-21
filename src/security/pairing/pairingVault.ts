import { getSessionSnapshot, setPairedCustomerId } from "@/security/session/sessionVault";

export {
  clearDeviceId,
  getDeviceInfo,
  getOrCreateDeviceId,
} from "@/helpers/auth/deviceId";

export { setPairedCustomerId };

/** Current paired clinic customer id (device binding), if any. */
export function getPairedCustomerId(): string | null {
  return getSessionSnapshot().customerId;
}
