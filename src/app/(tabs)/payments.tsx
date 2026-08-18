import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Stack, ThemedText } from "@/components/ui";

export default function PaymentsScreen() {
  return (
    <AppScreenShell
      description="This tab is ready for payment ledgers, transactions, filters, and settlement workflows."
      eyebrow="Main app"
      title="Payments"
    >
      <AppSectionCard
        title="Planned content"
        description="Skeleton placeholder for the payments dashboard."
      >
        <Stack space="compact">
          <ThemedText tone="muted">
            Add summaries, transaction lists, and payment actions here.
          </ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
