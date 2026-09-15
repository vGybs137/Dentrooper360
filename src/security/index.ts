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
  unpairClinic,
} from "@/api/functions/auth";
export {
  clearRefreshTokenSecurely,
  ensureRefreshTokenInMemory,
  flushRefreshTokenVault,
  isBiometricUnlockAvailable,
  persistRefreshTokenSecurely,
  unlockWithBiometrics,
  type BiometricUnlockResult,
} from "@/security/biometric/biometricUnlock";
export {
  ClinicSwitchError,
  switchClinic,
  type SwitchClinicOptions,
} from "@/session/switchClinic";
export {
  RemoveClinicError,
  removeClinic,
  type RemoveClinicResult,
} from "@/session/removeClinic";
export {
  canEnterApp,
  canUnlockSession,
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
  useCanUnlockSession,
  useCustomerId,
  useHasRefreshCredential,
  useIsAuthenticated,
  useRefreshToken,
} from "@/security/session/sessionVault";
export {
  isRecyclingTokens,
  recycleTokens,
  unlockSessionWithBiometrics,
} from "@/security/session/tokenRecycle";
export {
  hasUiRole,
  matchUiRole,
  useAuthRole,
  useScopeVersion,
  useSyncScope,
} from "@/security/rbac/authRole";
export { getItem, setItem } from "@/security/vault/secureStorage";
export {
  AUTH_REFRESH_TOKEN_KEY,
  clearBiometricRefreshToken,
  getBiometricRefreshToken,
  setBiometricRefreshToken,
} from "@/security/vault/refreshTokenVault";
