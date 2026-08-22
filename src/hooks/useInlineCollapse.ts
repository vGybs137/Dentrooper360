import { useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useThemeTokens } from "@/theme";

/** Shared height/opacity collapse used by inline calendar, time, and select panels. */
export function useInlineCollapse(visible: boolean, contentHeight: number) {
  const theme = useThemeTokens();
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: getAuthSlideDuration(theme),
      easing: AUTH_SLIDE_EASING,
    });
  }, [progress, theme, visible]);

  const containerStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
    opacity: progress.value,
    overflow: "hidden" as const,
  }));

  return { containerStyle };
}
