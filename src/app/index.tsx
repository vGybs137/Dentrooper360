import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { BrandedSplash } from "@/components/app/BrandLogo";
import { Button, ThemedText, ThemedView } from "@/components/ui";
import { hideNativeSplash } from "@/helpers/auth/nativeSplash";
import { restoreSavedSession } from "@/helpers/auth/sessionRefresh";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { prepareScheduleAppointments } from "@/helpers/schedule/prefetchScheduleAppointments";
import { useStartupSessionCheck } from "@/hooks/auth/useStartupSessionCheck";
import { useStartupSync } from "@/hooks/auth/useStartupSync";
import {
  setOfflineMode,
  useAuthStore,
  useCanEnterOffline,
  useCanUnlockSession,
  useCustomerId,
  useHasHydrated,
  useIsAuthenticated,
  useSyncStatusHasHydrated,
} from "@/stores";

export default function Index() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const customerId = useCustomerId();
  const hasHydrated = useHasHydrated();
  const syncStatusHydrated = useSyncStatusHasHydrated();
  const isAuthenticated = useIsAuthenticated();
  const canUnlock = useCanUnlockSession();
  const canEnterOffline = useCanEnterOffline();
  const isEnteringRef = useRef(false);
  const restoreAttemptedRef = useRef(false);
  const isMountedRef = useRef(true);
  const [isEntering, setIsEntering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
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

  const enterSchedule = useCallback(
    async (offline: boolean) => {
      if (isEnteringRef.current) {
        return;
      }

      isEnteringRef.current = true;
      setIsEntering(true);

      try {
        setOfflineMode(offline);
        if (customerId) {
          await clinicDatabaseManager.ensureActive(customerId);
        }
        await prepareScheduleAppointments();
        void hideNativeSplash();
        router.replace("/(tabs)/schedule" as Href);
      } catch {
        isEnteringRef.current = false;
        setIsEntering(false);
      }
    },
    [customerId, router],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

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

    if (isRestoring) {
      return () => {
        cancelled = true;
      };
    }

    if (!isAuthenticated && canUnlock && !restoreAttemptedRef.current) {
      restoreAttemptedRef.current = true;
      setIsRestoring(true);
      void restoreSavedSession().finally(() => {
        if (isMountedRef.current) {
          setIsRestoring(false);
        }
      });
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

    if (isValidatingSession || isRestoring) {
      return () => {
        cancelled = true;
      };
    }

    if (isSessionInvalid) {
      void (async () => {
        const { clearSession } = await import("@/security/session/sessionVault");
        await clearSession();
        if (!cancelled) {
          router.replace("/(auth)/login?intro=1" as Href);
        }
      })();
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
        if (!cancelled) {
          void enterSchedule(true);
        }
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
      if (!cancelled) {
        void enterSchedule(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    canEnterOffline,
    canUnlock,
    customerId,
    enterSchedule,
    hasHydrated,
    isAuthenticated,
    isSessionInvalid,
    isSessionValid,
    hasSyncedThisVisit,
    isSyncComplete,
    isSyncFailed,
    isRestoring,
    isValidatingSession,
    router,
    syncStatusHydrated,
  ]);

  const showSyncRetry = isSyncFailed && !canEnterOffline;
  const showContinueOffline = isSyncFailed && canEnterOffline;
  const retrySyncLabel = isRetryingSync
    ? t("splash.retryingSync")
    : t("splash.retrySync");

  return (
    <BrandedSplash>
      {showSyncRetry ? (
        <ThemedView align="center" space="compact" variant="stack">
          <ThemedText align="center" tone="muted">
            {t("splash.unableSync")}
          </ThemedText>
          <Button
            disabled={isRetryingSync || isEntering}
            label={retrySyncLabel}
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
            {t("splash.unableSyncContinue")}
          </ThemedText>
          <Button
            disabled={isEntering}
            label={isEntering ? t("splash.opening") : t("splash.continueOffline")}
            onPress={() => {
              void enterSchedule(true);
            }}
            tone="brand"
          />
          <Button
            disabled={isRetryingSync || isEntering}
            label={retrySyncLabel}
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
