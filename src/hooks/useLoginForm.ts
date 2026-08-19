import { useMutation } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";

import { login } from "@/api";
import { useStartupSync } from "@/hooks/useStartupSync";
import { useCustomerId } from "@/stores";
import { ApiError } from "@/types/api";

export function useLoginForm() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => {
      if (!customerId) {
        throw new ApiError(
          "Pair this device with a clinic before signing in.",
          400,
        );
      }

      return login({
        customerId,
        username: username.trim(),
        password,
      });
    },
    onSuccess: () => {
      setHasSignedIn(true);
    },
  });

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
  const canSubmit =
    Boolean(customerId) &&
    username.trim().length > 0 &&
    password.length > 0 &&
    !isSigningIn &&
    !hasSignedIn;
  const loginError =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Unable to sign in. Check your credentials and try again."
        : undefined;

  return {
    customerId,
    username,
    password,
    isPasswordVisible,
    hasSignedIn,
    isSigningIn,
    isSyncingNow,
    isAppReady,
    isSyncFailed,
    isRetryingSync,
    canSubmit,
    loginError,
    setUsername,
    setPassword,
    togglePasswordVisibility: () => {
      setIsPasswordVisible((visible) => !visible);
    },
    submit: () => {
      loginMutation.mutate();
    },
    retrySync: () => {
      void retrySync();
    },
    continueToApp: () => {
      router.replace("/(tabs)/schedule" as Href);
    },
    goToQrScanner: () => {
      router.replace("/(auth)/qr-scanner" as Href);
    },
  };
}

export type LoginFormState = ReturnType<typeof useLoginForm>;
