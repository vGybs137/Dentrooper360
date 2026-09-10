import { Stack } from "expo-router";

import { ClinicDatabaseBoundary } from "@/providers/ClinicDatabaseBoundary";

export default function AppointmentsLayout() {
  return (
    <ClinicDatabaseBoundary>
      <Stack screenOptions={{ headerShown: false }} />
    </ClinicDatabaseBoundary>
  );
}
