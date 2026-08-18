import { type Href, useRouter } from "expo-router";

import { AppScreenShell, AppSectionCard } from "@/components/app/AppScreenShell";
import { Button, Stack, TextField } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <AppScreenShell
      description="Authenticate the paired user here, then transition into the main tabbed application."
      eyebrow="Authentication flow"
      title="Login"
    >
      <AppSectionCard
        title="Credentials"
        description="The form fields below are placeholders for the real login implementation."
      >
        <Stack space="default">
          <TextField label="Email or username" placeholder="doctor@clinic.com" />
          <TextField label="Password" placeholder="Enter password" secureTextEntry />
          <Button
            label="Enter main app"
            onPress={() => router.replace("/(tabs)/schedule" as Href)}
          />
        </Stack>
      </AppSectionCard>
    </AppScreenShell>
  );
}
