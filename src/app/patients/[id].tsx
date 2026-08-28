import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { Button, ThemedText, ThemedView } from "@/components/ui";

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView
      header={{
        description:
          "Standalone patient detail route opened from the patients tab when a patient record is selected.",
        eyebrow: "Details",
        title: "Patient Details",
      }}
      scroll
      variant="screen"
    >
      <ThemedView variant="card">
        <ThemedView space="default" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText variant="title">Selected patient</ThemedText>
            <ThemedText tone="muted">
              Use this route for demographics, notes, balances, and
              patient-specific actions.
            </ThemedText>
          </ThemedView>
          <ThemedView space="compact" variant="stack">
            <ThemedText>Patient ID: {id ?? "unknown"}</ThemedText>
            <Button
              label="Back to patients"
              onPress={() => router.replace("/(tabs)/patients" as Href)}
              tone="neutral"
              variant="outline"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
