import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";

import { logout } from "@/api";
import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";
import { useAppTheme, type ThemeMode } from "@/theme";

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
  const { mode, setMode } = useAppTheme();
  const nextMode = nextThemeMode(mode);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      router.replace("/(auth)/login" as Href);
    },
  });

  return (
    <AppScreenShell
      description="This tab can host theme preferences, account settings, synchronization controls, and app configuration."
      eyebrow="Main app"
      title="Settings"
    >
      <AppSectionCard
        title="Account"
        description="Sign out of this device. The clinic pairing stays saved so you can sign back in."
      >
        <Stack space="compact">
          <Button
            disabled={logoutMutation.isPending}
            label={logoutMutation.isPending ? "Signing out..." : "Log out"}
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
      <AppSectionCard
        title="Planned content"
        description="Skeleton placeholder for settings and preferences."
      >
        <Stack space="compact">
          <ThemedText tone="muted">
            Add profile, theme, security, and sync settings here.
          </ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
