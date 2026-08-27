import { type Href, useRouter, useSegments } from "expo-router";

import { Button, ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";

export default function PatientsScreen() {
  const router = useRouter();
  const segments = useSegments();

  return (
    <ThemedView
      bottomInset={getWebTabBarInset(segments[0])}
      header={{
        description:
          "Use this tab for patient search, patient lists, segmentation, and navigation into individual patient records.",
        eyebrow: "Main app",
        title: "Patients",
      }}
      scroll
      variant="screen"
    >
      <ThemedView variant="card">
        <ThemedView space="default" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText variant="title">Primary action</ThemedText>
            <ThemedText tone="muted">
              Patient detail pages sit outside the tab navigator and can be
              opened from patient results or cards.
            </ThemedText>
          </ThemedView>
          <ThemedView space="compact" variant="stack">
            <Button
              label="Open patient details"
              onPress={() => router.push("/patients/patient-001" as Href)}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
