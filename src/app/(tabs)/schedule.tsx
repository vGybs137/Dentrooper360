import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack } from "@/components/ui";

export default function ScheduleScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="This is the default screen in the main tabbed app. It can later host calendars, agenda views, and appointment lists."
      eyebrow="Main app"
      title="Schedule"
    >
      <AppSectionCard
        title="Primary action"
        description="Appointment detail pages live outside the tabs and can be opened from here."
      >
        <Stack space="compact">
          <Button
            label="Open appointment details"
            onPress={() => router.push("/appointments/appt-001" as Href)}
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
