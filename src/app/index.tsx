import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";

import { BrandedSplash } from "@/components/app/BrandLogo";
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
      router.replace("/(auth)/onboarding" as Href);
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

  return (
    <BrandedSplash>
      {isSyncFailed ? (
        <Stack space="compact" align="center">
          <ThemedText align="center" tone="muted">
            Unable to sync clinic data. Check your connection and try again.
          </ThemedText>
          <Button
            disabled={isRetryingSync}
            label={isRetryingSync ? "Retrying sync..." : "Retry sync"}
            onPress={() => {
              void retrySync();
            }}
            tone="brand"
          />
        </Stack>
      ) : null}
    </BrandedSplash>
  );
}
