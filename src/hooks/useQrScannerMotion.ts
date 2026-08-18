import { useCallback, useEffect, useState } from "react";
import {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  useAuthSlideTiming,
  useSlideFromRightStyle,
  useSlideFromRightToLeftStyle,
} from "@/hooks/useAuthMotion";
import { useThemeTokens } from "@/theme";

export type QrScanStatus = "ready" | "paired";

type UseQrScannerMotionOptions = {
  windowWidth: number;
  viewfinderSize: number;
  scanInset: number;
  onRestoreOnboarding: () => void;
  onLeaveScanner: () => void;
};

export function useQrScannerMotion({
  windowWidth,
  viewfinderSize,
  scanInset,
  onRestoreOnboarding,
  onLeaveScanner,
}: UseQrScannerMotionOptions) {
  const theme = useThemeTokens();
  const slideTiming = useAuthSlideTiming();
  const [status, setStatus] = useState<QrScanStatus>("ready");
  const scanLine = useSharedValue(0);
  const pairedMark = useSharedValue(0);
  const enter = useSharedValue(0);
  const handoff = useSharedValue(0);

  const startHandoff = useCallback(() => {
    handoff.value = withTiming(1, slideTiming);
  }, [handoff, slideTiming]);

  const scheduleHandoff = useCallback(() => {
    setTimeout(() => {
      startHandoff();
    }, theme.semantic.motion.normal.duration);
  }, [startHandoff, theme.semantic.motion.normal.duration]);

  useEffect(() => {
    enter.value = withTiming(1, slideTiming);
  }, [enter, slideTiming]);

  useEffect(() => {
    if (status !== "ready") {
      cancelAnimation(scanLine);
      return;
    }

    scanLine.value = 0;
    scanLine.value = withRepeat(
      withTiming(1, {
        duration: theme.semantic.motion.overlay.duration * 4,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(scanLine);
    };
  }, [scanLine, status, theme.semantic.motion.overlay.duration]);

  useEffect(() => {
    if (status !== "paired") {
      pairedMark.value = 0;
      return;
    }

    pairedMark.value = withTiming(
      1,
      {
        duration: theme.semantic.motion.enter.duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(scheduleHandoff)();
        }
      },
    );
  }, [pairedMark, scheduleHandoff, status, theme.semantic.motion.enter.duration]);

  const cameraStyle = useSlideFromRightToLeftStyle(
    enter,
    handoff,
    windowWidth,
  );

  const loginStyle = useSlideFromRightStyle(handoff, windowWidth);

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanLine.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(
          scanLine.value,
          [0, 1],
          [scanInset, viewfinderSize - scanInset - 2],
        ),
      },
    ],
  }));

  const pairedMarkStyle = useAnimatedStyle(() => ({
    opacity: pairedMark.value,
    transform: [{ scale: interpolate(pairedMark.value, [0, 1], [0.72, 1]) }],
  }));

  const cancelScan = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    onRestoreOnboarding();
    enter.value = withTiming(0, slideTiming, (finished) => {
      if (finished) {
        runOnJS(onLeaveScanner)();
      }
    });
  }, [
    enter,
    onLeaveScanner,
    onRestoreOnboarding,
    slideTiming,
    status,
  ]);

  const simulateScan = useCallback(() => {
    if (status !== "ready") {
      return;
    }

    setStatus("paired");
  }, [status]);

  return {
    status,
    cameraStyle,
    loginStyle,
    scanLineStyle,
    pairedMarkStyle,
    cancelScan,
    simulateScan,
  };
}
