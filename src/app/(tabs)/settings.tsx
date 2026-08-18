import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Stack, ThemedText } from "@/components/ui";

export default function SettingsScreen() {
  return (
    <AppScreenShell
      description="This tab can host theme preferences, account settings, synchronization controls, and app configuration."
      eyebrow="Main app"
      title="Settings"
    >
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
