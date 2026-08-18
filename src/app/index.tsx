import { useEffect } from "react";
import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { useStartupSessionCheck } from "@/hooks/useStartupSessionCheck";
import { useStartupSync } from "@/hooks/useStartupSync";
import {
  useAuthStore,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";

type StartupStatusFlags = {
  hasHydrated: boolean;
  hasCustomerId: boolean;
  isAuthenticated: boolean;
  isValidatingSession: boolean;
  isSessionInvalid: boolean;
  isSyncing: boolean;
  isSyncFailed: boolean;
  isSyncComplete: boolean;
};

function getStartupStatusMessage({
  hasHydrated,
  hasCustomerId,
  isAuthenticated,
  isValidatingSession,
  isSessionInvalid,
  isSyncing,
  isSyncFailed,
  isSyncComplete,
}: StartupStatusFlags): string {
  switch (true) {
    case !hasHydrated:
      return "Loading saved customer and session data...";
    case !hasCustomerId || !isAuthenticated:
      return "Routing to the appropriate screen...";
    case isValidatingSession:
      return "Validating session with the server...";
    case isSessionInvalid:
      return "Session expired. Redirecting to login...";
    case isSyncing:
      return "Syncing clinic data with the server...";
    case isSyncFailed:
      return "Unable to sync clinic data. Check your connection and try again.";
    case isSyncComplete:
      return "Sync complete. Opening the app...";
    default:
      return "Preparing to sync clinic data...";
  }
}

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
  const {
    isPending: isSyncing,
    isSuccess: isSyncComplete,
    isError: isSyncFailed,
    isFetchedAfterMount: hasSyncedThisVisit,
    refetch: retrySync,
    isFetching: isRetryingSync,
  } = useStartupSync(isSessionValid);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!customerId) {
      void hideNativeSplash();
      router.replace("/(auth)/qr-scanner" as Href);
      return;
    }

    if (!isAuthenticated) {
      void hideNativeSplash();
      router.replace("/(auth)/login" as Href);
      return;
    }

    if (isValidatingSession) {
      return;
    }

    if (isSessionInvalid) {
      void hideNativeSplash();
      useAuthStore.getState().clearSession();
      router.replace("/(auth)/login" as Href);
      return;
    }

    if (!isSessionValid) {
      return;
    }

    if (isSyncFailed) {
      void hideNativeSplash();
      return;
    }

    if (!hasSyncedThisVisit) {
      return;
    }

    if (isSyncComplete) {
      void hideNativeSplash();
      router.replace("/(tabs)/schedule" as Href);
    }
  }, [
    customerId,
    hasHydrated,
    isAuthenticated,
    isSessionInvalid,
    isSessionValid,
    hasSyncedThisVisit,
    isSyncComplete,
    isSyncFailed,
    isValidatingSession,
    router,
  ]);

  const statusMessage = getStartupStatusMessage({
    hasHydrated,
    hasCustomerId: Boolean(customerId),
    isAuthenticated,
    isValidatingSession,
    isSessionInvalid,
    isSyncing: isSyncing || isRetryingSync,
    isSyncFailed,
    isSyncComplete,
  });

  return (
    <AppScreenShell
      description="Checking the persisted clinic pairing and session state, then synchronizing local data before routing the user into the app."
      eyebrow="Flow start"
      title="Splash Screen"
    >
      <AppSectionCard
        title="Startup check"
        description="The splash screen validates stored tokens, pulls and pushes clinic data, then opens the main app."
      >
        <Stack space="compact">
          <ThemedText tone="muted">{statusMessage}</ThemedText>
          {isSyncFailed ? (
            <Button
              label={isRetryingSync ? "Retrying sync..." : "Retry sync"}
              tone="brand"
              disabled={isRetryingSync}
              onPress={() => {
                void retrySync();
              }}
            />
          ) : null}
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
