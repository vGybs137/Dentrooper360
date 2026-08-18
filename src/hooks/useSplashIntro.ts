import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens } from "@/theme";

export function useSplashIntro(enabled: boolean) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(enabled ? 0 : 1);
  const contentHeight = useSharedValue(0);
  const started = useSharedValue(false);
  const holdMs = theme.semantic.motion.overlay.duration * 2;
  const moveMs =
    theme.semantic.motion.overlay.duration +
    theme.semantic.motion.enter.duration;
  const moveEasing = Easing.bezier(0.05, 0.7, 0.1, 1);

  function start() {
    if (!enabled || started.value) {
      return;
    }

    started.value = true;
    progress.value = withDelay(
      holdMs,
      withTiming(1, {
        duration: moveMs,
        easing: moveEasing,
      })
    );
  }

  function onContentLayout(height: number) {
    if (height <= 0) {
      return;
    }

    contentHeight.value = height;
    start();
  }

  const logoStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return { transform: [{ translateY: 0 }] };
    }

    const offset = Math.max((contentHeight.value - insets.top) / 2, 0);

    return {
      transform: [{ translateY: -progress.value * offset }],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return { transform: [{ translateY: 0 }] };
    }

    return {
      transform: [
        {
          translateY:
            contentHeight.value === 0
              ? 400
              : (1 - progress.value) * contentHeight.value,
        },
      ],
    };
  });

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: enabled
      ? interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP)
      : 0,
    height: enabled
      ? interpolate(progress.value, [0, 0.45], [36, 0], Extrapolation.CLAMP)
      : 0,
    overflow: "hidden" as const,
  }));

  return {
    enabled,
    progress,
    start,
    onContentLayout,
    logoStyle,
    contentStyle,
    wordmarkStyle,
  };
}
