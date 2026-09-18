import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useIsSwitchingClinic } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

/** Survives ClinicSessionProvider remounts during switchClinic. */
export function ClinicSwitchOverlay() {
  const { t } = useTranslation("a11y");
  const isSwitching = useIsSwitchingClinic();
  const native = useNativeColors();

  if (!isSwitching) {
    return null;
  }

  return (
    <Modal animationType="fade" statusBarTranslucent visible>
      <View
        accessibilityLabel={t("switchingClinic")}
        accessibilityViewIsModal
        pointerEvents="auto"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: native.surface.default,
            alignItems: "center",
            justifyContent: "center",
            zIndex: semantic.zIndex.critical,
          },
        ]}
      >
        <ActivityIndicator color={native.brand.default} size="large" />
      </View>
    </Modal>
  );
}
