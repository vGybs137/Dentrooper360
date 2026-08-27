import { useSegments } from "expo-router";

import { ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";

export default function PaymentsScreen() {
  const segments = useSegments();

  return (
    <ThemedView
      bottomInset={getWebTabBarInset(segments[0])}
      header={{
        description:
          "This tab is ready for payment ledgers, transactions, filters, and settlement workflows.",
        eyebrow: "Main app",
        title: "Payments",
      }}
      scroll
      variant="screen"
    >
      <ThemedView variant="card">
        <ThemedView space="default" variant="stack">
          <ThemedView space="compact" variant="stack">
            <ThemedText variant="title">Planned content</ThemedText>
            <ThemedText tone="muted">
              Skeleton placeholder for the payments dashboard.
            </ThemedText>
          </ThemedView>
          <ThemedView space="compact" variant="stack">
            <ThemedText tone="muted">
              Add summaries, transaction lists, and payment actions here.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
