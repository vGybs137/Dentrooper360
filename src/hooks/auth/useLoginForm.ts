import { type Href, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { canonicalCustomerId } from "@/helpers/auth/customerId";
import { prepareScheduleAppointments } from "@/helpers/schedule/prefetchScheduleAppointments";
import { useIsOnline } from "@/hooks/sync/useIsOnline";
import { useLoginMutation } from "@/hooks/auth/useLoginMutation";
import { useStartupSync } from "@/hooks/auth/useStartupSync";
import { t } from "@/i18n";
import { loginWithBiometrics, offerBiometricLogin } from "@/security";
import {
  markAppUnlocked,
  useAppLockStore,
  useAuthStore,
  useCustomerId,
} from "@/stores";
import { ApiError } from "@/types/api";

type LoginFields = {
  username: string;
  password: string;
};

export function useLoginForm() {
  const router = useRouter();
  const customerId = useCustomerId();
  const isOnline = useIsOnline();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [isBiometricSigningIn, setIsBiometricSigningIn] = useState(false);
  const [biometricError, setBiometricError] = useState<string | undefined>();

  const form = useForm<LoginFields>({
    defaultValues: { username: "", password: "" },
    mode: "onChange",
  });

  const loginMutation = useLoginMutation(customerId);

  const {
    isPending: isSyncing,
    isSuccess: isSyncComplete,
    isError: isSyncFailed,
    isFetchedAfterMount: hasSyncedThisVisit,
    refetch: retrySync,
    isFetching: isRetryingSync,
  } = useStartupSync(hasSignedIn);

  const isSigningIn = loginMutation.isPending;
  const isSyncingNow =
    hasSignedIn && (isSyncing || isRetryingSync || !hasSyncedThisVisit);
  const isAppReady =
    hasSignedIn && hasSyncedThisVisit && isSyncComplete && !isSyncFailed;
  const loginError =
    biometricError ??
    (loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? t("auth:login.error.generic")
        : undefined);

  useEffect(() => {
    if (!isAppReady) return;
    void prepareScheduleAppointments();
  }, [isAppReady]);

  return {
    customerId,
    form,
    isOnline,
    isPasswordVisible,
    hasSignedIn,
    isSigningIn,
    isSyncingNow,
    isAppReady,
    isSyncFailed,
    isRetryingSync,
    loginError,
    isBiometricSigningIn,
    togglePasswordVisibility: () => {
      setIsPasswordVisible((visible) => !visible);
    },
    submit: form.handleSubmit((data) => {
      if (!isOnline) {
        return;
      }

      loginMutation.mutate(
        { username: data.username.trim(), password: data.password },
        {
          onSuccess: () => {
            void offerBiometricLogin().finally(() => {
              setHasSignedIn(true);
            });
          },
        },
      );
    }),
    signInWithBiometrics: () => {
      if (isBiometricSigningIn || hasSignedIn || isSigningIn) {
        return;
      }

      setBiometricError(undefined);
      setIsBiometricSigningIn(true);
      void loginWithBiometrics()
        .then((result) => {
          if (result.status === "signed_in") {
            useAppLockStore.getState().setBiometricLoginEnabled(true);
            markAppUnlocked();
            setHasSignedIn(true);
            return;
          }

          if (result.status === "unavailable") {
            setBiometricError(t("auth:login.error.biometricUnavailable"));
            return;
          }

          if (result.status === "no_session") {
            setBiometricError(t("auth:login.error.biometricNoSession"));
          }
        })
        .finally(() => {
          setIsBiometricSigningIn(false);
        });
    },
    dismissLoginError: () => {
      setBiometricError(undefined);
      loginMutation.reset();
    },
    retrySync: () => {
      const current = useAuthStore.getState().customerId;
      const aligned = canonicalCustomerId(current);
      if (aligned && current !== aligned) {
        useAuthStore.getState().setCustomerId(aligned);
      }
      void retrySync();
    },
    backToSignIn: () => {
      setHasSignedIn(false);
    },
    continueToApp: () => {
      void (async () => {
        markAppUnlocked();
        await prepareScheduleAppointments();
        router.replace("/(tabs)/schedule" as Href);
      })();
    },
    goToQrScanner: () => {
      router.replace("/(auth)/qr-scanner" as Href);
    },
  };
}

export type LoginFormState = ReturnType<typeof useLoginForm>;
