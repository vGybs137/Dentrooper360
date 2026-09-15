import { hydrateAuthStore, useAuthStore } from "@/stores";
import { ApiError } from "@/types/api";
import type {
  AuthSession,
  AuthUser,
  ClinicsList,
  LoginRequest,
  PairRequest,
  PairResponse,
  SwitchClinicRequest,
  UnpairClinicRequest,
} from "@/types/auth";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { getOrCreateClinicRegistryEntry } from "@/database/ClinicRegistry";
import { synchronize } from "@/database/synchronize";
import { getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import { storeDeviceApiKey } from "@/security/pairing/pairingVault";

import {
  mapAuthSession,
  mapAuthUser,
  mapClinicsResponse,
  mapPairResponse,
  persistSession,
  toLoginPayload,
  toPairPayload,
  toSwitchClinicPayload,
  toUnpairClinicPayload,
  type WireAuthSession,
  type WireAuthUser,
  type WireClinicsResponse,
  type WirePairResponse,
} from "@/helpers/auth/auth";
import { httpClient } from "../httpClient";
import {
  AUTH_CLINICS_PATH,
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_ME_PATH,
  AUTH_PAIR_PATH,
  AUTH_REFRESH_PATH,
  AUTH_SWITCH_CLINIC_PATH,
  AUTH_UNPAIR_CLINIC_PATH,
} from "@/constants/auth";

export async function login(request: LoginRequest): Promise<AuthSession> {
  const response = await httpClient.post<WireAuthSession>(
    AUTH_LOGIN_PATH,
    toLoginPayload(request),
    { skipAuth: true },
  );

  const session = mapAuthSession(response.data);
  await persistSession(session, request.customerId);
  return session;
}

export async function refreshSession(): Promise<AuthSession> {
  await hydrateAuthStore();

  const { ensureRefreshTokenInMemory } = await import(
    "@/security/biometric/biometricUnlock"
  );
  const refreshToken = await ensureRefreshTokenInMemory(
    "Unlock Dentrooper to refresh your session",
  );

  if (!refreshToken) {
    throw new ApiError("No refresh token is stored.", 401);
  }

  const deviceId = await getOrCreateDeviceId();

  const response = await httpClient.post<WireAuthSession>(
    AUTH_REFRESH_PATH,
    { refresh_token: refreshToken, device_id: deviceId },
    { skipAuth: true },
  );

  const session = mapAuthSession(response.data);
  await persistSession(session, undefined, { deferRefreshVault: true });
  return session;
}

export async function logout(): Promise<void> {
  await hydrateAuthStore();
  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;
  const customerId = store.customerId;

  // Best-effort sync before clearing; never block logout on sync/network failure.
  if (customerId) {
    try {
      await synchronize(customerId);
    } catch {
      // Continue to clear the local session.
    }
  }

  try {
    if (refreshToken) {
      await httpClient.post(
        AUTH_LOGOUT_PATH,
        { refresh_token: refreshToken },
        { skipAuth: true },
      );
    }
  } catch {
    // Server logout is best-effort; local session still clears.
  } finally {
    const { clearSession } = await import("@/security/session/sessionVault");
    await clearSession();
  }
}

export async function pairDevice(
  request: PairRequest,
  options?: { activate?: boolean },
): Promise<PairResponse> {
  const response = await httpClient.post<WirePairResponse>(
    AUTH_PAIR_PATH,
    toPairPayload(request),
    { skipAuth: true },
  );

  const pairResponse = mapPairResponse(response.data);
  await storeDeviceApiKey(pairResponse.customerId, pairResponse.deviceApiKey);

  const activate = options?.activate !== false;
  if (activate) {
    useAuthStore.getState().setCustomerId(pairResponse.customerId);
    await clinicDatabaseManager.ensureActive(pairResponse.customerId);
  } else {
    // Add-clinic: register local DB slot without clobbering the active session.
    await getOrCreateClinicRegistryEntry(pairResponse.customerId);
  }

  return pairResponse;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<WireAuthUser>(AUTH_ME_PATH);
  return mapAuthUser(response.data);
}

export async function listClinics(): Promise<ClinicsList> {
  const deviceId = await getOrCreateDeviceId();
  const response = await httpClient.get<WireClinicsResponse>(AUTH_CLINICS_PATH, {
    params: { device_id: deviceId },
  });
  return mapClinicsResponse(response.data);
}

export async function switchClinicSession(
  request: SwitchClinicRequest,
): Promise<AuthSession> {
  const response = await httpClient.post<WireAuthSession>(
    AUTH_SWITCH_CLINIC_PATH,
    toSwitchClinicPayload(request),
  );

  return mapAuthSession(response.data);
}

export async function unpairClinic(request: UnpairClinicRequest): Promise<void> {
  await httpClient.post(
    AUTH_UNPAIR_CLINIC_PATH,
    toUnpairClinicPayload(request),
  );
}
