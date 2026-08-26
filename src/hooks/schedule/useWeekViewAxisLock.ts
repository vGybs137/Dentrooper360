import { useCallback, useMemo, useRef, useState } from "react";
import type { GestureResponderEvent } from "react-native";

import { WEEK_VIEW_PAGER_DIRECTION_LOCK_SLOP } from "@/constants/schedule";

type AxisLock = "undecided" | "horizontal" | "vertical";

export type WeekViewAxisLock = {
  pagerScrollEnabled: boolean;
  gridTouchHandlers: {
    onTouchStart: (event: GestureResponderEvent) => void;
    onTouchMove: (event: GestureResponderEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
  lockPagerForVerticalScroll: () => void;
  resetAxisLock: () => void;
};

/**
 * Chooses horizontal week paging vs vertical grid scrolling per gesture.
 * Disables the pager once vertical movement wins (AOSP-style slop × 2).
 */
export function useWeekViewAxisLock(): WeekViewAxisLock {
  const [pagerScrollEnabled, setPagerScrollEnabled] = useState(true);
  const originRef = useRef({ x: 0, y: 0 });
  const axisRef = useRef<AxisLock>("undecided");

  const resetAxisLock = useCallback(() => {
    axisRef.current = "undecided";
    setPagerScrollEnabled(true);
  }, []);

  const lockPagerForVerticalScroll = useCallback(() => {
    axisRef.current = "vertical";
    setPagerScrollEnabled(false);
  }, []);

  const gridTouchHandlers = useMemo(
    () => ({
      onTouchStart: (event: GestureResponderEvent) => {
        axisRef.current = "undecided";
        setPagerScrollEnabled(true);
        originRef.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
      },
      onTouchMove: (event: GestureResponderEvent) => {
        if (axisRef.current !== "undecided") return;

        const dx = event.nativeEvent.pageX - originRef.current.x;
        const dy = event.nativeEvent.pageY - originRef.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const slop = WEEK_VIEW_PAGER_DIRECTION_LOCK_SLOP;

        if (absDx < slop && absDy < slop) return;

        if (absDy > absDx) {
          axisRef.current = "vertical";
          setPagerScrollEnabled(false);
          return;
        }

        axisRef.current = "horizontal";
        setPagerScrollEnabled(true);
      },
      onTouchEnd: resetAxisLock,
      onTouchCancel: resetAxisLock,
    }),
    [resetAxisLock],
  );

  return {
    pagerScrollEnabled,
    gridTouchHandlers,
    lockPagerForVerticalScroll,
    resetAxisLock,
  };
}
