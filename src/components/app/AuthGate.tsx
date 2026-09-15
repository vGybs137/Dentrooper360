import { type Href, Redirect, useRouter } from "expo-router";
import { type ReactNode, useEffect } from "react";

import {
  resolveAuthGateState,
  type AuthGateState,
} from "@/security/gates/authGate";
import { useAuthStore, useHasHydrated } from "@/stores";

type AuthGateProps = {
  children: ReactNode;
  /** When true, render nothing while redirecting instead of children. */
  blockUntilReady?: boolean;
};

function destinationForGate(state: AuthGateState): Href | null {
  switch (state) {
    case "needs_pairing":
      return "/(auth)/onboarding" as Href;
    case "needs_login":
    case "needs_unlock":
      // Unlock is handled on the splash/index route; protected layouts send
      // unlockable sessions back through index so biometric can run once.
      return "/" as Href;
    case "authenticated":
      return null;
  }
}

/**
 * Protects clinic app routes: requires paired device + in-memory access session.
 */
export function AuthGate({ children, blockUntilReady = true }: AuthGateProps) {
  const hasHydrated = useHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const customerId = useAuthStore((s) => s.customerId);
  const user = useAuthStore((s) => s.user);
  const hasRefreshCredential = useAuthStore((s) => s.hasRefreshCredential);
  const router = useRouter();

  const gate = resolveAuthGateState();
  const redirectTo = destinationForGate(gate);

  useEffect(() => {
    if (!hasHydrated || !redirectTo) {
      return;
    }

    router.replace(redirectTo);
  }, [
    accessToken,
    customerId,
    hasHydrated,
    hasRefreshCredential,
    redirectTo,
    router,
    user,
  ]);

  if (!hasHydrated) {
    return blockUntilReady ? null : <>{children}</>;
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
}
