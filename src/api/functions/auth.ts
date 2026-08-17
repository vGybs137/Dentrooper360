import { tokenStore } from "@/stores";
import { ApiError } from "@/types/api";
import type { AuthSession, AuthUser, LoginRequest, PairRequest, PairResponse } from "@/types/auth";

import {
  mapAuthSession,
  mapAuthUser,
  mapPairResponse,
  persistSession,
  toLoginPayload,
  toPairPayload,
  type WireAuthSession,
  type WireAuthUser,
  type WirePairResponse,
} from "@/helpers/auth";
import { httpClient } from "../httpClient";
import {
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_ME_PATH,
  AUTH_PAIR_PATH,
  AUTH_REFRESH_PATH,
} from "@/constants/auth";

export async function login(request: LoginRequest): Promise<AuthSession> {
  const response = await httpClient.post<WireAuthSession>(
    AUTH_LOGIN_PATH,
    toLoginPayload(request),
    { skipAuth: true },
  );

  const session = mapAuthSession(response.data);
  await persistSession(session);
  return session;
}

export async function refreshSession(): Promise<AuthSession> {
  const refreshToken = await tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError("No refresh token is stored.", 401);
  }

  const response = await httpClient.post<WireAuthSession>(
    AUTH_REFRESH_PATH,
    { refresh_token: refreshToken },
    { skipAuth: true },
  );

  const session = mapAuthSession(response.data);
  await persistSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const refreshToken = await tokenStore.getRefreshToken();

  try {
    if (refreshToken) {
      await httpClient.post(
        AUTH_LOGOUT_PATH,
        { refresh_token: refreshToken },
        { skipAuth: true },
      );
    }
  } finally {
    await tokenStore.clear();
  }
}

export async function pairDevice(request: PairRequest): Promise<PairResponse> {
  const response = await httpClient.post<WirePairResponse>(
    AUTH_PAIR_PATH,
    toPairPayload(request),
    { skipAuth: true },
  );

  return mapPairResponse(response.data);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<WireAuthUser>(AUTH_ME_PATH);
  return mapAuthUser(response.data);
}
