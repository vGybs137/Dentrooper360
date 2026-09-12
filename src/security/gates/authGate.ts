import { useAuthStore } from "@/stores/authStore";

/**
 * Route/auth gate predicates. Phase 5 wires these into tab/detail layouts.
 */
export function isDevicePaired(customerId = useAuthStore.getState().customerId): boolean {
  return Boolean(customerId);
}

export function isSessionAuthenticated(): boolean {
  const { accessToken, refreshToken, user } = useAuthStore.getState();
  return Boolean(accessToken && refreshToken && user);
}

export function canEnterApp(): boolean {
  return isDevicePaired() && isSessionAuthenticated();
}

export type AuthGateState =
  | "needs_pairing"
  | "needs_login"
  | "authenticated";

export function resolveAuthGateState(): AuthGateState {
  if (!isDevicePaired()) {
    return "needs_pairing";
  }

  if (!isSessionAuthenticated()) {
    return "needs_login";
  }

  return "authenticated";
}
