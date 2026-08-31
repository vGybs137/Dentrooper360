import { useSegments } from "expo-router";

import { PatientsListScreen } from "@/components/patients/PatientsListScreen";
import { ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";

export default function PatientsScreen() {
  const segments = useSegments();

  return (
    <ThemedView
      bottomInset={getWebTabBarInset(segments[0])}
      header={{
        description:
          "Browse active patient files, search by name, and open individual records.",
        eyebrow: "Main app",
        title: "Patients",
      }}
      scroll={false}
      variant="screen"
    >
      <PatientsListScreen />
    </ThemedView>
  );
}
