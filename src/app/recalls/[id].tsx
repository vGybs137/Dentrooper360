import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function RecallDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AppScreenShell
      description="Standalone recall detail route opened from the recalls tab when a recall item is selected."
      eyebrow="Details"
      title="Recall Details"
    >
      <AppSectionCard
        title="Selected recall"
        description="Use this route for reminder timing, service context, and recall actions."
      >
        <Stack space="compact">
          <ThemedText>Recall ID: {id ?? "unknown"}</ThemedText>
          <Button
            label="Back to recalls"
            onPress={() => router.replace("/(tabs)/recalls" as Href)}
            tone="neutral"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
