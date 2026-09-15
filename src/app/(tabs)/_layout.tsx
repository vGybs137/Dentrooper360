import AppTabs from "@/components/app/AppTabs";
import { AuthGate } from "@/components/app/AuthGate";
import { ClinicDatabaseBoundary } from "@/providers/ClinicDatabaseBoundary";

export default function TabsLayout() {
  return (
    <AuthGate>
      <ClinicDatabaseBoundary>
        <AppTabs />
      </ClinicDatabaseBoundary>
    </AuthGate>
  );
}
