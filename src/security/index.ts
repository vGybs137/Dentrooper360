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
  persistRefreshTokenSecurely,
} from "@/security/vault/refreshTokenVault";
export {
  ClinicSwitchError,
  switchClinic,
  activateClinicFromStoredRefresh,
  type SwitchClinicOptions,
} from "@/session/switchClinic";
export {
  RemoveClinicError,
  removeClinic,
  type RemoveClinicResult,
  type RemoveClinicOptions,
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
  restoreSavedSession,
} from "@/security/session/tokenRecycle";
export {
  hasUiRole,
  matchUiRole,
  useAuthRole,
  useScopeVersion,
  useSyncScope,
} from "@/security/rbac/authRole";
export {
  authenticateDeviceOwner,
  canOfferBiometricLock,
  canUseDeviceAuth,
} from "@/security/biometric/deviceAuth";
export {
  loginWithBiometrics,
  offerBiometricLogin,
} from "@/security/biometric/biometricLogin";
export {
  APP_LOCK_TIMEOUT_15_MIN_MS,
  APP_LOCK_TIMEOUT_5_MIN_MS,
  APP_LOCK_TIMEOUT_IMMEDIATE_MS,
  DEFAULT_APP_LOCK_TIMEOUT_MS,
  shouldLockSession,
} from "@/security/biometric/shouldLockSession";
export { getItem, setItem } from "@/security/vault/secureStorage";
export { AUTH_REFRESH_TOKEN_KEY } from "@/security/vault/refreshTokenVault";
