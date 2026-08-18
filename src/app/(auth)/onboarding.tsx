import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="Introduce the app, explain the pairing flow, and move the user toward scanning the clinic QR code."
      eyebrow="Authentication flow"
      title="Onboarding"
    >
      <AppSectionCard
        title="Next step"
        description="This screen leads directly into the QR scanner in the current app structure."
      >
        <Stack space="compact">
          <Button
            label="Open QR scanner"
            onPress={() => router.push("/(auth)/qr-scanner" as Href)}
          />
          <ThemedText tone="muted">
            Add onboarding slides, illustrations, or permission guidance here
            later.
          </ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
