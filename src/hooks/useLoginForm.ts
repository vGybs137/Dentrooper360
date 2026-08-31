import { type Href, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import { prepareScheduleAppointments } from "@/helpers/prefetchScheduleAppointments";
import { useLoginMutation } from "@/hooks/useLoginMutation";
import { useStartupSync } from "@/hooks/useStartupSync";
import { useCustomerId } from "@/stores";
import { ApiError } from "@/types/api";

type LoginFields = {
  username: string;
  password: string;
};

export function useLoginForm() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);

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
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Unable to sign in. Check your credentials and try again."
        : undefined;

  useEffect(() => {
    if (!isAppReady) return;
    void prepareScheduleAppointments();
  }, [isAppReady]);

  return {
    customerId,
    form,
    isPasswordVisible,
    hasSignedIn,
    isSigningIn,
    isSyncingNow,
    isAppReady,
    isSyncFailed,
    isRetryingSync,
    loginError,
    togglePasswordVisibility: () => {
      setIsPasswordVisible((visible) => !visible);
    },
    submit: form.handleSubmit((data) => {
      loginMutation.mutate(
        { username: data.username.trim(), password: data.password },
        { onSuccess: () => setHasSignedIn(true) },
      );
    }),
    dismissLoginError: () => {
      loginMutation.reset();
    },
    retrySync: () => {
      void retrySync();
    },
    continueToApp: () => {
      void (async () => {
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
