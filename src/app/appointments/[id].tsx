import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AppScreenShell
      description="Standalone appointment detail route opened from the schedule flow instead of from the tab layout itself."
      eyebrow="Details"
      title="Appointment Details"
    >
      <AppSectionCard
        title="Selected appointment"
        description="Use this route for patient context, treatment info, and appointment actions."
      >
        <Stack space="compact">
          <ThemedText>Appointment ID: {id ?? "unknown"}</ThemedText>
          <Button
            label="Back to schedule"
            onPress={() => router.replace("/(tabs)/schedule" as Href)}
            tone="neutral"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
