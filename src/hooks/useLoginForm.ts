import { type Href, useRouter } from "expo-router";
import { useState } from "react";

import { useLoginMutation } from "@/hooks/useLoginMutation";
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
      loginMutation.mutate(
        { username: username.trim(), password },
        { onSuccess: () => setHasSignedIn(true) },
      );
    },
    dismissLoginError: () => {
      loginMutation.reset();
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
