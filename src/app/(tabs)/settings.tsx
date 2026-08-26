import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";

import { logout } from "@/api";
import {
  AppScreenShell,
  AppSectionCard,
} from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";
import { synchronize } from "@/database/synchronize";
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

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useCustomerId();
  const { mode, setMode } = useAppTheme();
  const nextMode = nextThemeMode(mode);
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new ApiError("No clinic is paired on this device.", 400);
      }
      await synchronize(customerId);
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
          {syncError ? (
            <ThemedText tone="alert">{syncError}</ThemedText>
          ) : null}
          {syncMutation.isSuccess && !syncMutation.isPending ? (
            <ThemedText tone="success">Clinic data is up to date.</ThemedText>
          ) : null}
          <Button
            disabled={!customerId || syncMutation.isPending}
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
            onPress={() => {
              logoutMutation.mutate();
            }}
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
