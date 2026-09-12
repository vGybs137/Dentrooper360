import { useSegments } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedIcon } from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import { closeIcon, wifiIcon, wifiOffIcon } from "@/constants/icons";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type ConnectivitySnackbarVariant = "offline" | "online";

export type SnackbarProps = {
  message: string;
  visible: boolean;
  variant: ConnectivitySnackbarVariant;
  onDismiss: () => void;
};

/** Full-width connectivity snackbar with status icon and manual dismiss. */
export function Snackbar({
  message,
  visible,
  variant,
  onDismiss,
}: SnackbarProps) {
  const { t } = useTranslation(["a11y", "sync"]);
  const native = useNativeColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const progress = useSharedValue(0);

  const aboveTabs = segments[0] === "(tabs)";
  const bottomOffset =
    insets.bottom +
    (aboveTabs ? BOTTOM_TAB_INSET : 0) +
    semantic.space.stack.compact;

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: visible
        ? semantic.motion.enter.duration
        : semantic.motion.exit.duration,
      easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    });
  }, [progress, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: (1 - progress.value) * semantic.space.stack.default,
      },
    ],
  }));

  const isOffline = variant === "offline";

  return (
    <View
      className="absolute inset-x-0 z-overlay"
      pointerEvents={visible ? "box-none" : "none"}
      style={{ bottom: bottomOffset }}
    >
      <Animated.View
        className="mx-0 flex-row items-center gap-inline border border-border-subtle px-page py-stack"
        style={[
          animatedStyle,
          {
            backgroundColor: native.surface.raised,
            borderRadius: semantic.radius.control,
          },
        ]}
      >
        <ThemedIcon
          accessibilityLabel={
            isOffline ? t("a11y:offline") : t("a11y:online")
          }
          name={isOffline ? wifiOffIcon : wifiIcon}
          tone={isOffline ? "alert" : "success"}
        />

        <ThemedText className="min-w-0 flex-1" variant="label">
          {message}
        </ThemedText>

        <Pressable
          accessibilityLabel={t("a11y:dismiss")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onDismiss}
        >
          <ThemedIcon name={closeIcon} tone="muted" />
        </Pressable>
      </Animated.View>
    </View>
  );
}
