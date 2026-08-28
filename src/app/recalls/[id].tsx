import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { Button, ThemedText, ThemedView } from "@/components/ui";

export default function RecallDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView
      header={{
        description:
          "Standalone recall detail route opened from the recalls tab when a recall item is selected.",
        eyebrow: "Details",
        title: "Recall Details",
      }}
      scroll
      variant="screen"
    >
      <ThemedView variant="card">
        <ThemedView space="default" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText variant="title">Selected recall</ThemedText>
            <ThemedText tone="muted">
              Use this route for reminder timing, service context, and recall
              actions.
            </ThemedText>
          </ThemedView>
          <ThemedView space="compact" variant="stack">
            <ThemedText>Recall ID: {id ?? "unknown"}</ThemedText>
            <Button
              label="Back to recalls"
              onPress={() => router.replace("/(tabs)/recalls" as Href)}
              tone="neutral"
              variant="outline"
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
