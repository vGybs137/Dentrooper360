import { Stack } from "expo-router";

import { ClinicDatabaseBoundary } from "@/providers/ClinicDatabaseBoundary";

export default function PaymentsLayout() {
  return (
    <ClinicDatabaseBoundary>
      <Stack screenOptions={{ headerShown: false }} />
    </ClinicDatabaseBoundary>
  );
}
