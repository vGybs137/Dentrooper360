import { useSegments } from "expo-router";

import { PaymentsListScreen } from "@/components/payments/PaymentsListScreen";
import { ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";
import { useStableSafeAreaInsets } from "@/helpers/ui/safeAreaInsets";

export default function PaymentsScreen() {
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
      <PaymentsListScreen />
    </ThemedView>
  );
}
