import { useAuthStore } from "@/stores/authStore";

/**
 * Route/auth gate predicates for tabs and detail layouts.
 */
export function isDevicePaired(
  customerId = useAuthStore.getState().customerId,
): boolean {
  return Boolean(customerId);
}

export function isSessionAuthenticated(): boolean {
  const { accessToken, user } = useAuthStore.getState();
  return Boolean(accessToken && user);
}

export function canUnlockSession(): boolean {
  const { hasRefreshCredential, user, customerId, accessToken } =
    useAuthStore.getState();
  return (
    Boolean(hasRefreshCredential && user && customerId) && !accessToken
  );
}

export function canEnterApp(): boolean {
  return isDevicePaired() && isSessionAuthenticated();
}

export type AuthGateState =
  | "needs_pairing"
  | "needs_login"
  | "needs_unlock"
  | "authenticated";

export function resolveAuthGateState(): AuthGateState {
  if (!isDevicePaired()) {
    return "needs_pairing";
  }

  if (isSessionAuthenticated()) {
    return "authenticated";
  }

  if (canUnlockSession()) {
    return "needs_unlock";
  }

  return "needs_login";
}
