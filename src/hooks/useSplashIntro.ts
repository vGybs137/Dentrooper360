import { useWindowDimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND_WORDMARK_HEIGHT } from "@/components/app/BrandLogo";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useThemeTokens } from "@/theme";

export function useSplashIntro(enabled: boolean) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const progress = useSharedValue(enabled ? 0 : 1);
  const exitProgress = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const logoHeight = useSharedValue(0);
  const started = useSharedValue(false);
  const holdMs = theme.semantic.motion.overlay.duration * 2;
  const moveMs = getAuthSlideDuration(theme);
  const moveEasing = AUTH_SLIDE_EASING;
  const headingBlock =
    theme.semantic.space.section +
    theme.semantic.type.display.lineHeight +
    theme.semantic.space.gap.compact +
    theme.semantic.type.body.lineHeight;
  const fieldsBlock =
    theme.semantic.space.section * 2 +
    theme.semantic.size["control-lg"] * 2 +
    theme.semantic.space.gap.default;

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
      }),
    );
  }

  function onContentLayout(height: number) {
    if (height <= 0) {
      return;
    }

    contentHeight.value = height;
    start();
  }

  function onLogoLayout(height: number) {
    if (height <= 0) {
      return;
    }

    logoHeight.value = height;
  }

  function restore() {
    if (!enabled || exitProgress.value === 0) {
      return;
    }

    exitProgress.value = withTiming(0, {
      duration: moveMs,
      easing: moveEasing,
    });
  }

  function dismiss(onFinished?: () => void) {
    if (!enabled || exitProgress.value !== 0) {
      onFinished?.();
      return;
    }

    exitProgress.value = withTiming(
      1,
      {
        duration: moveMs,
        easing: moveEasing,
      },
      (finished) => {
        if (finished && onFinished) {
          runOnJS(onFinished)();
        }
      },
    );
  }

  const logoStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return { transform: [{ translateY: 0 }] };
    }

    const introOffset = Math.max((contentHeight.value - insets.top) / 2, 0);
    const restY = -progress.value * introOffset;

    if (logoHeight.value === 0) {
      return { transform: [{ translateY: restY }] };
    }

    const logoRestTop =
      (windowHeight - fieldsBlock) / 2 - headingBlock - logoHeight.value;
    const loginRestY =
      logoRestTop - (windowHeight - logoHeight.value) / 2;

    return {
      transform: [
        {
          translateY: restY + exitProgress.value * (loginRestY - restY),
        },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return { transform: [{ translateY: 0 }] };
    }

    const height = contentHeight.value === 0 ? 400 : contentHeight.value;

    return {
      transform: [
        {
          translateY:
            (1 - progress.value * (1 - exitProgress.value)) * height,
        },
      ],
    };
  });

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: enabled
      ? interpolate(progress.value, [0, 0.45], [1, 0], Extrapolation.CLAMP)
      : 0,
    height: enabled
      ? interpolate(progress.value, [0, 0.45], [BRAND_WORDMARK_HEIGHT, 0], Extrapolation.CLAMP)
      : 0,
    overflow: "hidden" as const,
  }));

  const dismissWordmarkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      exitProgress.value,
      [0, 0.45],
      [1, 0],
      Extrapolation.CLAMP
    ),
    height: interpolate(
      exitProgress.value,
      [0, 0.45],
      [BRAND_WORDMARK_HEIGHT, 0],
      Extrapolation.CLAMP
    ),
    overflow: "hidden" as const,
  }));

  return {
    enabled,
    progress,
    exitProgress,
    start,
    dismiss,
    restore,
    onContentLayout,
    onLogoLayout,
    logoStyle,
    contentStyle,
    wordmarkStyle,
    dismissWordmarkStyle,
  };
}
