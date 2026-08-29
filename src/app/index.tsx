import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";

import { BrandedSplash } from "@/components/app/BrandLogo";
import { Button, ThemedText, ThemedView } from "@/components/ui";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { prepareScheduleAppointments } from "@/helpers/prefetchScheduleAppointments";
import { useStartupSessionCheck } from "@/hooks/useStartupSessionCheck";
import { useStartupSync } from "@/hooks/useStartupSync";
import {
  setOfflineMode,
  useAuthStore,
  useCanEnterOffline,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
  useSyncStatusHasHydrated,
} from "@/stores";

export default function Index() {
  const router = useRouter();
  const customerId = useCustomerId();
  const hasHydrated = useHasHydrated();
  const syncStatusHydrated = useSyncStatusHasHydrated();
  const isAuthenticated = useIsAuthenticated();
  const canEnterOffline = useCanEnterOffline();
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
    let cancelled = false;

    const enterSchedule = async (offline: boolean) => {
      setOfflineMode(offline);
      await prepareScheduleAppointments();
      if (cancelled) return;
      void hideNativeSplash();
      router.replace("/(tabs)/schedule" as Href);
    };

    if (!hasHydrated || !syncStatusHydrated) {
      return () => {
        cancelled = true;
      };
    }

    if (!customerId) {
      router.replace("/(auth)/onboarding" as Href);
      return () => {
        cancelled = true;
      };
    }

    if (!isAuthenticated) {
      router.replace("/(auth)/login?intro=1" as Href);
      return () => {
        cancelled = true;
      };
    }

    if (isValidatingSession) {
      return () => {
        cancelled = true;
      };
    }

    if (isSessionInvalid) {
      useAuthStore.getState().clearSession();
      router.replace("/(auth)/login?intro=1" as Href);
      return () => {
        cancelled = true;
      };
    }

    if (!isSessionValid) {
      return () => {
        cancelled = true;
      };
    }

    if (isSyncFailed) {
      if (canEnterOffline) {
        void enterSchedule(true);
        return () => {
          cancelled = true;
        };
      }

      void hideNativeSplash();
      return () => {
        cancelled = true;
      };
    }

    if (!hasSyncedThisVisit) {
      return () => {
        cancelled = true;
      };
    }

    if (isSyncComplete) {
      void enterSchedule(false);
    }

    return () => {
      cancelled = true;
    };
  }, [
    canEnterOffline,
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
    syncStatusHydrated,
  ]);

  const showSyncRetry = isSyncFailed && !canEnterOffline;
  const showContinueOffline = isSyncFailed && canEnterOffline;

  return (
    <BrandedSplash>
      {showSyncRetry ? (
        <ThemedView align="center" space="compact" variant="stack">
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
        </ThemedView>
      ) : null}
      {showContinueOffline ? (
        <ThemedView align="center" space="compact" variant="stack">
          <ThemedText align="center" tone="muted">
            Unable to sync right now. You can continue with previously synced
            clinic data.
          </ThemedText>
          <Button
            label="Continue offline"
            onPress={() => {
              void (async () => {
                setOfflineMode(true);
                await prepareScheduleAppointments();
                void hideNativeSplash();
                router.replace("/(tabs)/schedule" as Href);
              })();
            }}
            tone="brand"
          />
          <Button
            disabled={isRetryingSync}
            label={isRetryingSync ? "Retrying sync..." : "Retry sync"}
            onPress={() => {
              void retrySync();
            }}
            tone="brand"
            variant="outline"
          />
        </ThemedView>
      ) : null}
    </BrandedSplash>
  );
}
