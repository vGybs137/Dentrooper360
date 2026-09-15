import * as LocalAuthentication from "expo-local-authentication";
import { AppState, type NativeEventSubscription, Platform } from "react-native";

import {
  clearBiometricRefreshToken,
  getBiometricRefreshToken,
  setBiometricRefreshToken,
} from "@/security/vault/refreshTokenVault";
import { useAuthStore } from "@/stores/authStore";

/**
 * Biometric unlock: SecureStore `requireAuthentication` prompts the OS once
 * on cold-start reads. LocalAuthentication is only for availability checks.
 */
export type BiometricUnlockResult =
  | { status: "unlocked"; refreshToken: string }
  | { status: "unavailable" }
  | { status: "cancelled" }
  | { status: "failed"; message?: string }
  | { status: "missing" };

let vaultDirty = false;
let flushSubscription: NativeEventSubscription | null = null;
let flushInFlight: Promise<void> | null = null;

export async function isBiometricUnlockAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return false;
  }

  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return false;
    }

    return LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

function mapSecureStoreFailure(error: unknown): BiometricUnlockResult {
  const message = error instanceof Error ? error.message : undefined;
  const normalized = (message ?? "").toLowerCase();

  if (
    normalized.includes("cancel") ||
    normalized.includes("user_cancel") ||
    normalized.includes("system_cancel")
  ) {
    return { status: "cancelled" };
  }

  return { status: "failed", message };
}

export async function unlockWithBiometrics(
  promptMessage = "Unlock Dentrooper",
): Promise<BiometricUnlockResult> {
  if (!useAuthStore.getState().hasRefreshCredential) {
    return { status: "missing" };
  }

  const biometricsAvailable = await isBiometricUnlockAvailable();
  const refreshBoundToBiometrics =
    useAuthStore.getState().refreshBoundToBiometrics;

  if (refreshBoundToBiometrics && !biometricsAvailable) {
    return { status: "unavailable" };
  }

  try {
    const refreshToken = await getBiometricRefreshToken(promptMessage, {
      requireAuthentication: refreshBoundToBiometrics,
    });

    if (!refreshToken) {
      useAuthStore.getState().setHasRefreshCredential(false);
      return { status: "missing" };
    }

    useAuthStore.getState().setRefreshToken(refreshToken);
    vaultDirty = false;
    return { status: "unlocked", refreshToken };
  } catch (error) {
    if (!biometricsAvailable && refreshBoundToBiometrics) {
      return { status: "unavailable" };
    }

    return mapSecureStoreFailure(error);
  }
}

async function writeRefreshTokenToVault(token: string): Promise<void> {
  const biometricsAvailable = await isBiometricUnlockAvailable();

  try {
    await setBiometricRefreshToken(token, {
      requireAuthentication: biometricsAvailable,
    });
    useAuthStore.getState().setRefreshBoundToBiometrics(biometricsAvailable);
    vaultDirty = false;
  } catch {
    await setBiometricRefreshToken(token, { requireAuthentication: false });
    useAuthStore.getState().setRefreshBoundToBiometrics(false);
    vaultDirty = false;
  }
}

/**
 * Persist refresh for cold start. Updates memory immediately.
 * Pass `deferVaultWrite` during access-token refresh so Android does not
 * prompt on every rotation; the vault flushes when the app backgrounds.
 */
export async function persistRefreshTokenSecurely(
  token: string,
  options?: { deferVaultWrite?: boolean },
): Promise<void> {
  useAuthStore.getState().setRefreshToken(token);
  useAuthStore.getState().setHasRefreshCredential(true);

  if (options?.deferVaultWrite) {
    vaultDirty = true;
    ensureVaultFlushSubscription();
    return;
  }

  await writeRefreshTokenToVault(token);
}

export async function flushRefreshTokenVault(): Promise<void> {
  if (!vaultDirty) {
    return;
  }

  const token = useAuthStore.getState().refreshToken;
  if (!token) {
    vaultDirty = false;
    return;
  }

  if (flushInFlight) {
    return flushInFlight;
  }

  flushInFlight = writeRefreshTokenToVault(token).finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
}

function ensureVaultFlushSubscription(): void {
  if (flushSubscription) {
    return;
  }

  flushSubscription = AppState.addEventListener("change", (next) => {
    if (next === "background" || next === "inactive") {
      void flushRefreshTokenVault();
    }
  });
}

export async function clearRefreshTokenSecurely(): Promise<void> {
  vaultDirty = false;
  await clearBiometricRefreshToken();
  useAuthStore.getState().setRefreshToken(null);
  useAuthStore.getState().setHasRefreshCredential(false);
  useAuthStore.getState().setRefreshBoundToBiometrics(false);
}

/**
 * Ensure a refresh token is in memory. Uses biometric vault when missing.
 */
export async function ensureRefreshTokenInMemory(
  promptMessage = "Unlock Dentrooper to continue",
): Promise<string | null> {
  const cached = useAuthStore.getState().refreshToken;
  if (cached) {
    return cached;
  }

  if (!useAuthStore.getState().hasRefreshCredential) {
    return null;
  }

  const unlock = await unlockWithBiometrics(promptMessage);
  if (unlock.status === "unlocked") {
    return unlock.refreshToken;
  }

  return null;
}
