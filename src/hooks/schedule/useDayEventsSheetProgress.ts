import { useCallback } from "react";
import {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const OPEN_PROGRESS_THRESHOLD = 0.2;
const CLOSE_PROGRESS_THRESHOLD = 0.5;
const OPEN_VELOCITY_Y = -800;
const CLOSE_VELOCITY_Y = 800;

const SETTLE_SPRING = {
  damping: 28,
  stiffness: 320,
  mass: 0.85,
  overshootClamping: true,
} as const;

export type UseDayEventsSheetProgressOptions = {
  onSettledOpen: () => void;
  onSettledClosed: () => void;
  onMotionStart: () => void;
};

export type UseDayEventsSheetProgressResult = {
  openProgress: SharedValue<number>;
  snapHeightSV: SharedValue<number>;
  setSnapHeight: (height: number) => void;
  sheetAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
  sheetAnimatedProps: ReturnType<typeof useAnimatedProps>;
  /** Call from UI-thread pan begin (calendar or sheet). */
  beginDrag: () => void;
  /**
   * Finger-follow: progress = start − translationY / snapHeight.
   * Up (negative translationY) opens; down closes.
   */
  applyDragTranslation: (translationY: number) => void;
  /** Settle open/closed from current progress + fling velocity. */
  endDrag: (velocityY: number) => void;
  open: () => void;
  close: () => void;
};

/**
 * Shared 0…1 openProgress for day-events sheets (month + week).
 * All drag/settle writes stay on the UI thread; React only hears settle / motion start.
 */
export function useDayEventsSheetProgress({
  onSettledOpen,
  onSettledClosed,
  onMotionStart,
}: UseDayEventsSheetProgressOptions): UseDayEventsSheetProgressResult {
  const openProgress = useSharedValue(0);
  const snapHeightSV = useSharedValue(0);
  const dragStartProgress = useSharedValue(0);

  const setSnapHeight = useCallback(
    (height: number) => {
      snapHeightSV.value = Math.max(0, height);
    },
    [snapHeightSV],
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    const snap = Math.max(snapHeightSV.value, 1);
    const progress = openProgress.value;
    return {
      // Fully closed: hide so a 1px edge can't sit on the host/Quick Add boundary.
      opacity: progress <= 0 ? 0 : 1,
      transform: [{ translateY: (1 - progress) * snap }],
    };
  });

  // Drop hits as soon as the sheet is visually closed — don't wait for React settle.
  const sheetAnimatedProps = useAnimatedProps(() => ({
    pointerEvents:
      openProgress.value > 0.02 ? ("auto" as const) : ("none" as const),
  }));

  const beginDrag = useCallback(() => {
    "worklet";
    dragStartProgress.value = openProgress.value;
    scheduleOnRN(onMotionStart);
  }, [dragStartProgress, onMotionStart, openProgress]);

  const applyDragTranslation = useCallback(
    (translationY: number) => {
      "worklet";
      const snap = snapHeightSV.value;
      if (snap <= 0) return;
      const next = dragStartProgress.value - translationY / snap;
      openProgress.value = Math.min(1, Math.max(0, next));
    },
    [dragStartProgress, openProgress, snapHeightSV],
  );

  const settleOpen = useCallback(() => {
    "worklet";
    scheduleOnRN(onMotionStart);
    openProgress.value = withSpring(1, SETTLE_SPRING, (finished) => {
      if (finished) scheduleOnRN(onSettledOpen);
    });
  }, [onMotionStart, onSettledOpen, openProgress]);

  const settleClosed = useCallback(() => {
    "worklet";
    scheduleOnRN(onMotionStart);
    openProgress.value = withSpring(0, SETTLE_SPRING, (finished) => {
      if (finished) scheduleOnRN(onSettledClosed);
    });
  }, [onMotionStart, onSettledClosed, openProgress]);

  const endDrag = useCallback(
    (velocityY: number) => {
      "worklet";
      const flingOpen = velocityY < OPEN_VELOCITY_Y;
      const flingClose = velocityY > CLOSE_VELOCITY_Y;

      let shouldOpen: boolean;
      if (flingOpen) {
        shouldOpen = true;
      } else if (flingClose) {
        shouldOpen = false;
      } else if (dragStartProgress.value < 0.5) {
        // Opening from the calendar — keep the low threshold.
        shouldOpen = openProgress.value > OPEN_PROGRESS_THRESHOLD;
      } else {
        // Dismissing an open sheet — close past midpoint.
        shouldOpen = openProgress.value >= CLOSE_PROGRESS_THRESHOLD;
      }

      if (shouldOpen) {
        settleOpen();
      } else {
        settleClosed();
      }
    },
    [dragStartProgress, openProgress, settleClosed, settleOpen],
  );

  /** JS-callable open/close for imperative handle (tap to open). */
  const openFromJS = useCallback(() => {
    onMotionStart();
    openProgress.value = withSpring(1, SETTLE_SPRING, (finished) => {
      if (finished) scheduleOnRN(onSettledOpen);
    });
  }, [onMotionStart, onSettledOpen, openProgress]);

  const closeFromJS = useCallback(() => {
    onMotionStart();
    openProgress.value = withSpring(0, SETTLE_SPRING, (finished) => {
      if (finished) scheduleOnRN(onSettledClosed);
    });
  }, [onMotionStart, onSettledClosed, openProgress]);

  return {
    openProgress,
    snapHeightSV,
    setSnapHeight,
    sheetAnimatedStyle,
    sheetAnimatedProps,
    beginDrag,
    applyDragTranslation,
    endDrag,
    open: openFromJS,
    close: closeFromJS,
  };
}
