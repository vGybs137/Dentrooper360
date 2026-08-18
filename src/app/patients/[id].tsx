import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AppScreenShell
      description="Standalone patient detail route opened from the patients tab when a patient record is selected."
      eyebrow="Details"
      title="Patient Details"
    >
      <AppSectionCard
        title="Selected patient"
        description="Use this route for demographics, notes, balances, and patient-specific actions."
      >
        <Stack space="compact">
          <ThemedText>Patient ID: {id ?? "unknown"}</ThemedText>
          <Button
            label="Back to patients"
            onPress={() => router.replace("/(tabs)/patients" as Href)}
            tone="neutral"
            variant="outline"
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
