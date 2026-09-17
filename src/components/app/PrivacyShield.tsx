import { BlurView } from "expo-blur";
import * as ScreenCapture from "expo-screen-capture";
import { useEffect, useState } from "react";
import {
  AppState,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { useNativeColors } from "@/theme";
import { useResolvedTheme } from "@/stores/themePreferencesStore";
import { semantic } from "@/tokens";

const ANDROID_CAPTURE_KEY = "privacy-shield";

/**
 * Hides app content in the app switcher and while backgrounded.
 * Native ScreenCapture handles the OS snapshot; the Modal covers every route
 * for the in-app transition. No patient data is rendered here.
 */
export function PrivacyShield() {
  const native = useNativeColors();
  const resolved = useResolvedTheme();
  const [obscured, setObscured] = useState(
    AppState.currentState === "background",
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!(await ScreenCapture.isAvailableAsync()) || cancelled) {
          return;
        }

        if (Platform.OS === "ios") {
          await ScreenCapture.enableAppSwitcherProtectionAsync(0.85);
          return;
        }

        if (Platform.OS === "android") {
          await ScreenCapture.preventScreenCaptureAsync(ANDROID_CAPTURE_KEY);
        }
      } catch {
        // Web / unsupported builds skip native protection.
      }
    })();

    return () => {
      cancelled = true;
      if (Platform.OS === "ios") {
        void ScreenCapture.disableAppSwitcherProtectionAsync();
      } else if (Platform.OS === "android") {
        void ScreenCapture.allowScreenCaptureAsync(ANDROID_CAPTURE_KEY);
      }
    };
  }, []);

  useEffect(() => {
    // inactive also covers Face ID / system sheets; only background the Modal.
    // Native ScreenCapture still blurs the app-switcher snapshot on resign-active.
    const subscription = AppState.addEventListener("change", (nextState) => {
      setObscured(nextState === "background");
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Modal
      animationType="none"
      statusBarTranslucent
      transparent
      visible={obscured}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: native.surface.default,
            zIndex: semantic.zIndex.critical,
          },
        ]}
      >
        <BlurView
          intensity={90}
          style={StyleSheet.absoluteFill}
          tint={resolved === "dark" ? "dark" : "light"}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: native.surface.default, opacity: 0.88 },
          ]}
        />
      </View>
    </Modal>
  );
}
