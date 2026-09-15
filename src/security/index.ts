/**
 * Public security module surface.
 * Prefer importing from `@/security` for new code.
 */

export {
  getCurrentUser,
  listClinics,
  login,
  logout,
  pairDevice,
  refreshSession,
  switchClinicSession,
} from "@/security/api/authApi";
export {
  isBiometricUnlockAvailable,
  unlockWithBiometrics,
  type BiometricUnlockResult,
} from "@/security/biometric/biometricUnlock";
export {
  ClinicSwitchError,
  switchClinic,
  type SwitchClinicOptions,
} from "@/security/clinicSwitch/switchClinic";
export {
  RemoveClinicError,
  removeClinic,
  type RemoveClinicResult,
} from "@/session/removeClinic";
export {
  canEnterApp,
  isDevicePaired,
  isSessionAuthenticated,
  resolveAuthGateState,
  type AuthGateState,
} from "@/security/gates/authGate";
export {
  clearDeviceApiKey,
  clearDeviceId,
  getDeviceApiKey,
  getDeviceInfo,
  getOrCreateDeviceId,
  getPairedCustomerId,
  setPairedCustomerId,
  storeDeviceApiKey,
} from "@/security/pairing/pairingVault";
export {
  clearAllSecurityState,
  clearSession,
  getSessionSnapshot,
  hydrateAuthStore,
  setSession,
  useAccessToken,
  useAuthStore,
  useAuthUser,
  useCustomerId,
  useIsAuthenticated,
  useRefreshToken,
} from "@/security/session/sessionVault";
export { isRecyclingTokens, recycleTokens } from "@/security/session/tokenRecycle";
export {
  MobileSyncMode,
  resolveMobileSyncMode,
} from "@/security/sync/syncModes";
export { getItem, setItem } from "@/security/vault/secureStorage";
