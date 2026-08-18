import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack } from "@/components/ui";

export default function RecallsScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="Use this tab for recall queues, follow-up reminders, and recall lifecycle management."
      eyebrow="Main app"
      title="Recalls"
    >
      <AppSectionCard
        title="Primary action"
        description="Recall detail pages are separate stack routes so they open outside the tab layout."
      >
        <Stack space="compact">
          <Button
            label="Open recall details"
            onPress={() => router.push("/recalls/recall-001" as Href)}
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
