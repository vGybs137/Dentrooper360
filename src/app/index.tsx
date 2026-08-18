import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function Index() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="This is the first screen in the app flow. Use it as the branded launch surface before sending users into onboarding."
      eyebrow="Flow start"
      title="Splash Screen"
    >
      <AppSectionCard
        title="Entry path"
        description="The splash screen leads into onboarding as the first step in the setup flow."
      >
        <Stack space="compact">
          <Button
            label="Continue to onboarding"
            onPress={() => router.push("/(auth)/onboarding" as Href)}
          />
          <ThemedText tone="muted">
            Later you can replace this manual action with your real startup
            logic, loading checks, or timed transition.
          </ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
