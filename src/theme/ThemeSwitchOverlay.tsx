import { BlurView } from "expo-blur";
import type { RefObject } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
  type View as RNView,
} from "react-native";

import { useNativeColors } from "@/theme/themeHooks";
import {
  useIsSwitchingTheme,
  useResolvedTheme,
} from "@/stores/themePreferencesStore";
import { semantic } from "@/tokens";

export function ThemeSwitchOverlay({
  blurTargetRef,
}: {
  blurTargetRef: RefObject<RNView | null>;
}) {
  const isSwitching = useIsSwitchingTheme();
  const resolved = useResolvedTheme();
  const native = useNativeColors();

  if (!isSwitching) {
    return null;
  }

  return (
    <BlurView
      accessibilityLabel="Switching appearance"
      accessibilityViewIsModal
      blurMethod={
        Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined
      }
      blurTarget={Platform.OS === "android" ? blurTargetRef : undefined}
      intensity={50}
      pointerEvents="auto"
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: semantic.zIndex.critical,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
      tint={resolved === "dark" ? "dark" : "light"}
    >
      <View pointerEvents="none">
        <ActivityIndicator color={native.brand.default} size="large" />
      </View>
    </BlurView>
  );
}
