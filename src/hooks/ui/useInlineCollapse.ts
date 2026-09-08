import { useEffect, useState } from "react";
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/auth/motion";

/**
 * Shared height/opacity collapse used by inline calendar, time, and select panels.
 * Keeps children mounted through the exit animation, then reports `mounted: false`.
 */
export function useInlineCollapse(
  visible: boolean,
  contentHeight: number,
  options?: { instant?: boolean },
) {
  const duration = getAuthSlideDuration();
  const progress = useSharedValue(visible ? 1 : 0);
  const [mounted, setMounted] = useState(visible);
  const instant = options?.instant === true;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }

    if (!visible && instant) {
      progress.value = 0;
      setMounted(false);
      return;
    }

    progress.value = withTiming(visible ? 1 : 0, {
      duration,
      easing: AUTH_SLIDE_EASING,
    });
  }, [duration, instant, progress, visible]);

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (current === 0 && previous !== 0 && previous !== null) {
        runOnJS(setMounted)(false);
      }
    },
    [],
  );

  const containerStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
    opacity: progress.value,
    overflow: "hidden" as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return { containerStyle, chevronStyle, mounted: visible || mounted };
}
