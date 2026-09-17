import { useEffect } from "react";
import { AppState } from "react-native";

import { shouldLockSession } from "@/security/biometric/shouldLockSession";
import { useAppLockHasHydrated, useAppLockStore } from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";

function hasRestorableSession(): boolean {
  const { accessToken, user, customerId, hasRefreshCredential } =
    useAuthStore.getState();
  if (accessToken && user) {
    return true;
  }

  return Boolean(hasRefreshCredential && user && customerId);
}

/** Locks on resume when the app has been away longer than the chosen timeout. */
export function useAppLockOnResume() {
  const hasHydrated = useAppLockHasHydrated();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      const store = useAppLockStore.getState();

      // Inactive also fires for the system biometric sheet. Only a real
      // background starts the away clock, or "Immediately" re-locks itself.
      if (nextState === "background") {
        if (store.backgroundedAt == null) {
          store.setBackgroundedAt(Date.now());
        }
        return;
      }

      if (nextState !== "active") {
        return;
      }

      const backgroundedAt = store.backgroundedAt;
      store.setBackgroundedAt(null);
      if (backgroundedAt == null || !store.enabled || !hasRestorableSession()) {
        return;
      }

      if (
        shouldLockSession(
          store.enabled,
          backgroundedAt,
          Date.now(),
          store.timeoutMs,
        )
      ) {
        store.lock();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated]);
}
