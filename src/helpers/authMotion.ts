import { Easing } from "react-native-reanimated";

import type { RuntimeTheme } from "@/tokens";

export const AUTH_SLIDE_EASING = Easing.bezier(0.05, 0.7, 0.1, 1);

export function getAuthSlideDuration(theme: RuntimeTheme): number {
  return (
    theme.semantic.motion.overlay.duration +
    theme.semantic.motion.enter.duration
  );
}

export function getSlideFromRightOffset(
  progress: number,
  width: number,
): number {
  "worklet";
  return (1 - progress) * width;
}

export function getSlideToLeftOffset(progress: number, width: number): number {
  "worklet";
  return -progress * width;
}

export function getSlideFromRightToLeftOffset(
  enterProgress: number,
  exitProgress: number,
  width: number,
): number {
  "worklet";
  return getSlideFromRightOffset(enterProgress, width) + getSlideToLeftOffset(
    exitProgress,
    width,
  );
}
