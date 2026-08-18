import { useEffect } from "react";
import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Stack, ThemedText } from "@/components/ui";
import { useStartupSessionCheck } from "@/hooks/useStartupSessionCheck";
import {
  useAuthStore,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";

export default function Index() {
  const router = useRouter();
  const customerId = useCustomerId();
  const hasHydrated = useHasHydrated();
  const isAuthenticated = useIsAuthenticated();
  const {
    isPending: isValidatingSession,
    isSuccess: isSessionValid,
    isError: isSessionInvalid,
  } = useStartupSessionCheck();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!customerId) {
      router.replace("/(auth)/qr-scanner" as Href);
      return;
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/login" as Href);
      return;
    }

    if (isValidatingSession) {
      return;
    }

    if (isSessionValid) {
      router.replace("/(tabs)/schedule" as Href);
      return;
    }

    if (isSessionInvalid) {
      useAuthStore.getState().clearSession();
      router.replace("/(auth)/login" as Href);
    }
  }, [
    customerId,
    hasHydrated,
    isAuthenticated,
    isSessionInvalid,
    isSessionValid,
    isValidatingSession,
    router,
  ]);

  const statusMessage = !hasHydrated
    ? "Loading saved customer and session data..."
    : !customerId || !isAuthenticated
      ? "Routing to the appropriate screen..."
      : isValidatingSession
        ? "Validating session with the server..."
        : isSessionValid
          ? "Session valid. Opening the app..."
          : "Session expired. Redirecting to login...";

  return (
    <AppScreenShell
      description="Checking the persisted clinic pairing and session state before routing the user into the correct part of the app."
      eyebrow="Flow start"
      title="Splash Screen"
    >
      <AppSectionCard
        title="Startup check"
        description="The splash screen validates stored tokens against the /me endpoint before entering the main app."
      >
        <Stack space="compact">
          <ThemedText tone="muted">{statusMessage}</ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
