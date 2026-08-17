import { tokenStore } from "@/stores";
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  PairRequest,
  PairResponse,
} from "@/types/auth";

export type WireAuthUser = {
  id: string;
  full_name: string;
  color: number | null;
  starting_hour: string;
  ending_hour: string;
};

export type WireAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: WireAuthUser;
};

export type WirePairResponse = {
  device_id: string;
  customer_id: string;
  paired_at: string;
};

export function mapAuthUser(user: WireAuthUser): AuthUser {
  return {
    id: user.id,
    fullName: user.full_name,
    color: user.color,
    startingHour: user.starting_hour,
    endingHour: user.ending_hour,
  };
}

export function mapAuthSession(session: WireAuthSession): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date(session.expires_at),
    user: mapAuthUser(session.user),
  };
}

export function mapPairResponse(response: WirePairResponse): PairResponse {
  return {
    deviceId: response.device_id,
    customerId: response.customer_id,
    pairedAt: new Date(response.paired_at),
  };
}

export function toLoginPayload(request: LoginRequest) {
  return {
    customer_id: request.customerId,
    username: request.username,
    password: request.password,
  };
}

export function toPairPayload(request: PairRequest) {
  return {
    customer_id: request.customerId,
    device_id: request.deviceId,
    device_name: request.deviceName,
    platform: request.platform,
    version: request.version,
    x_api_key: request.xApiKey,
  };
}

export async function persistSession(session: AuthSession): Promise<void> {
  await Promise.all([
    tokenStore.setAccessToken(session.accessToken),
    tokenStore.setRefreshToken(session.refreshToken),
  ]);
}
