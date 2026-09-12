import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ui";
import { useIsSwitchingClinic } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

/** Survives ClinicSessionProvider remounts during switchClinic. */
export function ClinicSwitchOverlay() {
  const { t } = useTranslation(["auth", "a11y"]);
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
        accessibilityLabel={t("a11y:switchingClinic")}
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
          {t("auth:clinic.switching")}
        </ThemedText>
        <ThemedText align="center" tone="inverse" variant="label">
          {t("auth:clinic.switchingSubtitle")}
        </ThemedText>
      </View>
    </Modal>
  );
}
