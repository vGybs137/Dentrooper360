import { type Href, useRouter, useSegments } from "expo-router";

import { Button, ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";

export default function RecallsScreen() {
  const router = useRouter();
  const segments = useSegments();

  return (
    <ThemedView
      bottomInset={getWebTabBarInset(segments[0])}
      header={{
        description:
          "Use this tab for recall queues, follow-up reminders, and recall lifecycle management.",
        eyebrow: "Main app",
        title: "Recalls",
      }}
      scroll
      variant="screen"
    >
      <ThemedView variant="card">
        <ThemedView space="default" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText variant="title">Primary action</ThemedText>
            <ThemedText tone="muted">
              Recall detail pages are separate stack routes so they open
              outside the tab layout.
            </ThemedText>
          </ThemedView>
          <ThemedView space="compact" variant="stack">
            <Button
              label="Open recall details"
              onPress={() => router.push("/recalls/recall-001" as Href)}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
