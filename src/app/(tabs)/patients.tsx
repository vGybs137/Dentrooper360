import { useSegments } from "expo-router";

import { PatientsListScreen } from "@/components/patients/PatientsListScreen";
import { ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";
import { useStableSafeAreaInsets } from "@/helpers/safeAreaInsets";

export default function PatientsScreen() {
  const segments = useSegments();
  const insets = useStableSafeAreaInsets();

  return (
    <ThemedView
      bottomInset={getWebTabBarInset(segments[0])}
      edges={["left", "right"]}
      inset="compact"
      padBottom={false}
      scroll={false}
      variant="screen"
      style={{ paddingTop: insets.top }}
    >
      <PatientsListScreen />
    </ThemedView>
  );
}
