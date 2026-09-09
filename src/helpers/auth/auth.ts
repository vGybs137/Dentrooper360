import { hydrateAuthStore, useAuthStore } from "@/stores";
import type {
  AuthSession,
  AuthUser,
  ClinicMembership,
  ClinicsList,
  LoginRequest,
  PairRequest,
  PairResponse,
  SwitchClinicRequest,
} from "@/types/auth";

export type WireAuthUser = {
  id: string;
  customer_id?: string | null;
  full_name: string;
  email: string | null;
  currency_symbol: string | null;
  color: number | null;
  sync_scope?: string | null;
  scope_version?: number | null;
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

export type WireClinicMembership = {
  customer_id: string;
  provider_id: string;
  clinic_display_name: string | null;
  sync_scope: string;
  scope_version: number;
  is_active: boolean;
};

export type WireClinicsResponse = {
  active_customer_id: string;
  clinics: WireClinicMembership[];
};

export function mapAuthUser(user: WireAuthUser): AuthUser {
  return {
    id: user.id,
    customerId: user.customer_id ?? null,
    fullName: user.full_name,
    email: user.email ?? null,
    currencySymbol: user.currency_symbol ?? null,
    color: user.color,
    syncScope: user.sync_scope ?? null,
    scopeVersion: user.scope_version ?? null,
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

export function mapClinicMembership(clinic: WireClinicMembership): ClinicMembership {
  return {
    customerId: clinic.customer_id,
    providerId: clinic.provider_id,
    clinicDisplayName: clinic.clinic_display_name,
    syncScope: clinic.sync_scope,
    scopeVersion: clinic.scope_version,
    isActive: clinic.is_active,
  };
}

export function mapClinicsResponse(response: WireClinicsResponse): ClinicsList {
  return {
    activeCustomerId: response.active_customer_id,
    clinics: response.clinics.map(mapClinicMembership),
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
    product_id: request.productId,
    device_id: request.deviceId,
    device_name: request.deviceName,
    platform: request.platform,
    version: request.version,
    x_api_key: request.xApiKey,
  };
}

export function toSwitchClinicPayload(request: SwitchClinicRequest) {
  return {
    customer_id: request.customerId,
    refresh_token: request.refreshToken ?? undefined,
  };
}

export async function persistSession(
  session: AuthSession,
  customerId?: string | null,
): Promise<void> {
  await hydrateAuthStore();

  const store = useAuthStore.getState();
  if (customerId !== undefined) {
    store.setCustomerId(customerId);
  }

  store.setSession(session);
}
