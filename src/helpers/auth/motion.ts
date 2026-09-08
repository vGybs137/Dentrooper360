import { Easing } from "react-native-reanimated";

import { semantic } from "@/tokens";

/** Shared slide easing used across auth, sheets, and details transitions. */
export const AUTH_SLIDE_EASING = Easing.bezier(0.05, 0.7, 0.1, 1);

export function getAuthSlideDuration(): number {
  return (
    semantic.motion.overlay.duration + semantic.motion.enter.duration
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
  return (
    getSlideFromRightOffset(enterProgress, width) +
    getSlideToLeftOffset(exitProgress, width)
  );
}
