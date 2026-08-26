import { useCallback } from "react";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  AUTH_SLIDE_EASING,
  getAuthSlideDuration,
} from "@/helpers/authMotion";
import { useThemeTokens } from "@/theme";

export type UseBottomSheetMotionOptions = {
  enabled?: boolean;
  enterDelay?: number;
  progress?: SharedValue<number>;
  exitProgress?: SharedValue<number>;
  sheetHeight?: SharedValue<number>;
  onMeasured?: (height: number) => void;
};

export function useBottomSheetMotion({
  enabled = true,
  enterDelay = 0,
  progress: externalProgress,
  exitProgress: externalExitProgress,
  sheetHeight: externalSheetHeight,
  onMeasured,
}: UseBottomSheetMotionOptions = {}) {
  const theme = useThemeTokens();
  const internalProgress = useSharedValue(enabled ? 0 : 1);
  const internalExitProgress = useSharedValue(0);
  const internalSheetHeight = useSharedValue(0);
  const progress = externalProgress ?? internalProgress;
  const exitProgress = externalExitProgress ?? internalExitProgress;
  const sheetHeight = externalSheetHeight ?? internalSheetHeight;
  const started = useSharedValue(false);
  const moveMs = getAuthSlideDuration(theme);
  const moveEasing = AUTH_SLIDE_EASING;
  const ownsProgress = externalProgress === undefined;

  const enter = useCallback(() => {
    if (!enabled || !ownsProgress || started.value) {
      return;
    }

    started.value = true;
    internalProgress.value = withDelay(
      enterDelay,
      withTiming(1, {
        duration: moveMs,
        easing: moveEasing,
      }),
    );
  }, [enabled, enterDelay, internalProgress, moveEasing, moveMs, ownsProgress, started]);

  const onLayout = useCallback(
    (height: number) => {
      if (height <= 0) {
        return;
      }

      sheetHeight.value = height;
      onMeasured?.(height);
      enter();
    },
    [enter, onMeasured, sheetHeight],
  );

  const restore = useCallback(() => {
    if (!enabled || !ownsProgress || exitProgress.value === 0) {
      return;
    }

    internalExitProgress.value = withTiming(0, {
      duration: moveMs,
      easing: moveEasing,
    });
  }, [
    enabled,
    exitProgress,
    internalExitProgress,
    moveEasing,
    moveMs,
    ownsProgress,
  ]);

  const dismiss = useCallback(
    (onFinished?: () => void) => {
      if (!enabled || !ownsProgress || exitProgress.value !== 0) {
        onFinished?.();
        return;
      }

      internalExitProgress.value = withTiming(
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
    },
    [
      enabled,
      exitProgress,
      internalExitProgress,
      moveEasing,
      moveMs,
      ownsProgress,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled) {
      return { transform: [{ translateY: 0 }] };
    }

    const height = sheetHeight.value === 0 ? 400 : sheetHeight.value;

    return {
      transform: [
        {
          translateY:
            (1 - progress.value * (1 - exitProgress.value)) * height,
        },
      ],
    };
  });

  return {
    enabled,
    animatedStyle,
    onLayout,
    enter,
    dismiss,
    restore,
    progress,
    exitProgress,
  };
}

export type BottomSheetMotion = ReturnType<typeof useBottomSheetMotion>;
