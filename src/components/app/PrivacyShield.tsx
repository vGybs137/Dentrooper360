import { BlurView } from "expo-blur";
import { useEffect, useState, type RefObject } from "react";
import { AppState, Platform, StyleSheet, View, type View as RNView } from "react-native";

import { useIsAuthenticated } from "@/stores/authStore";
import { useResolvedTheme } from "@/stores/themePreferencesStore";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

/**
 * Hides clinic UI in the app switcher. No patient data is rendered here.
 */
export function PrivacyShield({
  blurTargetRef,
}: {
  blurTargetRef: RefObject<RNView | null>;
}) {
  const isAuthenticated = useIsAuthenticated();
  const resolved = useResolvedTheme();
  const native = useNativeColors();
  const [hidden, setHidden] = useState(AppState.currentState !== "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setHidden(nextState !== "active");
    });
    return () => {
      subscription.remove();
    };
  }, []);

  if (!isAuthenticated || !hidden) {
    return null;
  }

  return (
    <BlurView
      blurMethod={
        Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined
      }
      blurTarget={Platform.OS === "android" ? blurTargetRef : undefined}
      intensity={80}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: semantic.zIndex.critical }]}
      tint={resolved === "dark" ? "dark" : "light"}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: native.surface.default, opacity: 0.92 },
        ]}
      />
    </BlurView>
  );
}
