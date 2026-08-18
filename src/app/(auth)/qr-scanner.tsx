import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, ThemedText } from "@/components/ui";

export default function QrScannerScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="Use this screen to scan the provider or clinic QR code, validate the pairing payload, and then continue into login."
      eyebrow="Authentication flow"
      title="QR Scanner"
    >
      <AppSectionCard
        title="Scanner status"
        description="This is a placeholder for camera permissions, scanner preview, and scan feedback."
      >
        <Stack space="compact">
          <Button
            label="Simulate successful scan"
            onPress={() => router.push("/(auth)/login" as Href)}
            tone="success"
          />
          <ThemedText tone="muted">
            Add camera permission handling and scan error states on this screen
            when you wire the real scanner.
          </ThemedText>
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
