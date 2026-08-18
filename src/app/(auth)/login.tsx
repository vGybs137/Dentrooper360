import { useEffect, useState } from "react";
import { type Href, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { login } from "@/api";
import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, TextField, ThemedText } from "@/components/ui";
import { useStartupSync } from "@/hooks/useStartupSync";
import { useCustomerId } from "@/stores";
import { ApiError } from "@/types/api";

export default function LoginScreen() {
  const router = useRouter();
  const customerId = useCustomerId();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasSignedIn, setHasSignedIn] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => {
      if (!customerId) {
        throw new ApiError("Pair this device with a clinic before signing in.", 400);
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

  useEffect(() => {
    if (!hasSignedIn || isSyncFailed || !hasSyncedThisVisit || !isSyncComplete) {
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [hasSignedIn, hasSyncedThisVisit, isSyncComplete, isSyncFailed, router]);

  const isSigningIn = loginMutation.isPending;
  const isSyncingNow = hasSignedIn && (isSyncing || isRetryingSync || !hasSyncedThisVisit);
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

  return (
    <AppScreenShell
      description="Authenticate the paired user here, then sync clinic data before opening the main app."
      eyebrow="Authentication flow"
      title="Login"
    >
      <AppSectionCard
        title="Credentials"
        description="Sign in with your clinic account. Data is synced after a successful login, not after pairing."
      >
        <Stack space="default">
          {!customerId ? (
            <Stack space="compact">
              <ThemedText tone="muted">
                Pair this device with a clinic QR code before signing in.
              </ThemedText>
              <Button
                label="Scan clinic QR"
                onPress={() => router.replace("/(auth)/qr-scanner" as Href)}
                tone="brand"
                variant="outline"
              />
            </Stack>
          ) : null}
          <TextField
            autoCapitalize="none"
            autoComplete="username"
            editable={!isSigningIn && !hasSignedIn}
            label="Email or username"
            onChangeText={setUsername}
            placeholder="doctor@clinic.com"
            value={username}
          />
          <TextField
            autoComplete="password"
            editable={!isSigningIn && !hasSignedIn}
            label="Password"
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            value={password}
          />
          {loginError ? <ThemedText tone="alert">{loginError}</ThemedText> : null}
          {hasSignedIn ? (
            <Stack space="compact">
              <ThemedText tone="muted">
                {isSyncFailed
                  ? "Unable to sync clinic data. Check your connection and try again."
                  : isSyncingNow
                    ? "Syncing clinic data with the server..."
                    : "Sync complete. Opening the app..."}
              </ThemedText>
              {isSyncFailed ? (
                <Button
                  disabled={isRetryingSync}
                  label={isRetryingSync ? "Retrying sync..." : "Retry sync"}
                  onPress={() => {
                    void retrySync();
                  }}
                  tone="brand"
                />
              ) : null}
            </Stack>
          ) : (
            <Button
              disabled={!canSubmit}
              label={isSigningIn ? "Signing in..." : "Sign in"}
              onPress={() => {
                loginMutation.mutate();
              }}
            />
          )}
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
