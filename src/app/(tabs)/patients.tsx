import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack } from "@/components/ui";

export default function PatientsScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="Use this tab for patient search, patient lists, segmentation, and navigation into individual patient records."
      eyebrow="Main app"
      title="Patients"
    >
      <AppSectionCard
        title="Primary action"
        description="Patient detail pages sit outside the tab navigator and can be opened from patient results or cards."
      >
        <Stack space="compact">
          <Button
            label="Open patient details"
            onPress={() => router.push("/patients/patient-001" as Href)}
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
