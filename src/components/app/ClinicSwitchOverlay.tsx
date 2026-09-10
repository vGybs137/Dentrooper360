import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui";
import { useIsSwitchingClinic } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

/** Survives ClinicSessionProvider remounts during switchClinic. */
export function ClinicSwitchOverlay() {
  const isSwitching = useIsSwitchingClinic();
  const native = useNativeColors();

  if (!isSwitching) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible
    >
      <View
        accessibilityLabel="Switching clinic"
        accessibilityViewIsModal
        pointerEvents="auto"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,${semantic.opacity.scrim})`,
            alignItems: "center",
            justifyContent: "center",
            zIndex: semantic.zIndex.critical,
            paddingHorizontal: semantic.space.inline.comfortable,
            gap: semantic.space.gap.default,
          },
        ]}
      >
        <ActivityIndicator color={native.brand.default} size="large" />
        <ThemedText
          align="center"
          className="font-semibold"
          tone="inverse"
          variant="body"
        >
          Switching clinic…
        </ThemedText>
        <ThemedText align="center" tone="inverse" variant="label">
          Syncing and preparing local data
        </ThemedText>
      </View>
    </Modal>
  );
}
