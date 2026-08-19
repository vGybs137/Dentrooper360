import { useMemo } from "react";
import {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import {
  AUTH_SLIDE_EASING,
  getAuthSlideDuration,
  getSlideFromRightOffset,
  getSlideFromRightToLeftOffset,
  getSlideToLeftOffset,
} from "@/helpers/authMotion";
import { useThemeTokens } from "@/theme";

export function useAuthSlideDuration(): number {
  const theme = useThemeTokens();
  return getAuthSlideDuration(theme);
}

export function useAuthSlideTiming() {
  const duration = useAuthSlideDuration();

  return useMemo(
    () => ({
      duration,
      easing: AUTH_SLIDE_EASING,
    }),
    [duration],
  );
}

export function useSlideFromRightStyle(
  progress: SharedValue<number>,
  width: number,
) {
  return useAnimatedStyle(() => ({
    transform: [{ translateX: getSlideFromRightOffset(progress.value, width) }],
  }));
}

export function useSlideToLeftStyle(
  progress: SharedValue<number>,
  width: number,
) {
  return useAnimatedStyle(() => ({
    transform: [{ translateX: getSlideToLeftOffset(progress.value, width) }],
  }));
}

export function useSlideFromRightToLeftStyle(
  enterProgress: SharedValue<number>,
  exitProgress: SharedValue<number>,
  width: number,
) {
  return useAnimatedStyle(() => ({
    transform: [
      {
        translateX: getSlideFromRightToLeftOffset(
          enterProgress.value,
          exitProgress.value,
          width,
        ),
      },
    ],
  }));
}

export { AUTH_SLIDE_EASING } from "@/helpers/authMotion";
