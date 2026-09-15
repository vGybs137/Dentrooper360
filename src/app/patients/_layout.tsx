import { Stack } from "expo-router";

import { AuthGate } from "@/components/app/AuthGate";
import { ClinicDatabaseBoundary } from "@/providers/ClinicDatabaseBoundary";

export default function PatientsLayout() {
  return (
    <AuthGate>
      <ClinicDatabaseBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </ClinicDatabaseBoundary>
    </AuthGate>
  );
}
