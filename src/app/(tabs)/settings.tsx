import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";

import { logout } from "@/api";
import {
  AppScreenShell,
  AppSectionCard,
} from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";
import { synchronize } from "@/database/synchronize";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useCustomerId } from "@/stores";
import { useAppTheme, type ThemeMode } from "@/theme";
import { ApiError } from "@/types/api";

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

function themeLabel(mode: ThemeMode) {
  switch (mode) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    default:
      return "System";
  }
}

function nextThemeMode(mode: ThemeMode): ThemeMode {
  return THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length];
}

function formatLastSyncedAt(timestamp: number | null): string {
  if (timestamp == null) {
    return "Never synced on this device";
  }

  return `Last synced ${dayjs(timestamp).format("MMM D, YYYY h:mm A")}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useCustomerId();
  const { mode, setMode } = useAppTheme();
  const nextMode = nextThemeMode(mode);
  const { isOffline, hasUnsynced, lastSuccessfulSyncAt, refresh } =
    useSyncStatus();
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new ApiError("No clinic is paired on this device.", 400);
      }
      if (isOffline) {
        throw new ApiError(
          "You're offline. Sync will run automatically when you're back online.",
          0,
        );
      }
      await synchronize(customerId);
    },
    onSuccess: () => {
      void refresh();
    },
  });
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/(auth)/login" as Href);
    },
  });
  const syncError =
    syncMutation.error instanceof ApiError
      ? syncMutation.error.message
      : syncMutation.isError
        ? "Unable to sync clinic data. Check your connection and try again."
        : undefined;
  const logoutError =
    logoutMutation.error instanceof ApiError
      ? logoutMutation.error.message
      : logoutMutation.isError
        ? "Unable to sync clinic data. Stay online and try logging out again."
        : undefined;

  const connectionLabel = isOffline ? "Offline" : "Online";
  const pendingLabel = hasUnsynced
    ? "Pending local changes"
    : "No pending local changes";

  function requestLogout() {
    if (!hasUnsynced) {
      logoutMutation.mutate();
      return;
    }

    Alert.alert(
      "Pending changes",
      "You have local changes that haven't synced yet. Logging out will try to sync first and may fail if you're offline.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            logoutMutation.mutate();
          },
        },
      ],
    );
  }

  return (
    <AppScreenShell
      description="This tab can host theme preferences, account settings, synchronization controls, and app configuration."
      eyebrow="Main app"
      title="Settings"
    >
      <AppSectionCard
        title="Sync"
        description="Push local changes and pull the latest clinic data now. Sync also runs automatically in the background."
      >
        <Stack space="compact">
          <ThemedText tone="muted" variant="label">
            {connectionLabel} · {pendingLabel}
          </ThemedText>
          <ThemedText tone="muted" variant="label">
            {formatLastSyncedAt(lastSuccessfulSyncAt)}
          </ThemedText>
          {isOffline ? (
            <ThemedText tone="alert" variant="label">
              Sync is unavailable while offline.
            </ThemedText>
          ) : null}
          {syncError ? (
            <ThemedText tone="alert">{syncError}</ThemedText>
          ) : null}
          {syncMutation.isSuccess && !syncMutation.isPending && !isOffline ? (
            <ThemedText tone="success">Clinic data is up to date.</ThemedText>
          ) : null}
          <Button
            disabled={!customerId || syncMutation.isPending || isOffline}
            label={syncMutation.isPending ? "Syncing..." : "Sync now"}
            onPress={() => {
              syncMutation.reset();
              syncMutation.mutate();
            }}
            tone="brand"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
      <AppSectionCard
        title="Account"
        description="Sign out of this device. The clinic pairing stays saved so you can sign back in."
      >
        <Stack space="compact">
          {logoutError ? (
            <ThemedText tone="alert">{logoutError}</ThemedText>
          ) : null}
          <Button
            disabled={logoutMutation.isPending || syncMutation.isPending}
            label={
              logoutMutation.isPending
                ? "Syncing and signing out..."
                : "Log out"
            }
            onPress={requestLogout}
            tone="alert"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
      <AppSectionCard
        title="Appearance"
        description={`Currently using the ${themeLabel(mode).toLowerCase()} theme.`}
      >
        <Stack space="compact">
          <Button
            label={`Switch to ${themeLabel(nextMode).toLowerCase()}`}
            onPress={() => setMode(nextMode)}
            tone="brand"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
