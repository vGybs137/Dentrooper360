import { useCallback, useMemo, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type {
  PageScrollStateChangedNativeEventData,
  PagerViewOnPageSelectedEventData,
} from "react-native-pager-view";

import { useCalendarSelectionStore } from "@/stores/calendarSelectionStore";
import {
  buildDayViewWindow,
  coerceDayViewDayKey,
  DAY_PAGER_RADIUS,
  toDayKey,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

export type UseVisibleDayResult = {
  days: DayKey[];
  initialIndex: number;
  pageIndex: number;
  visibleDayKey: DayKey;
  isDragging: boolean;
  onPageSelected: (
    event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>,
  ) => void;
  onPageScrollStateChanged: (
    event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>,
  ) => void;
  setPageIndex: (index: number) => void;
};

/**
 * Tracks the settled day pager page.
 * Day window skips Sundays and is frozen around the center day from first mount.
 */
export function useVisibleDay(centerDayKey?: DayKey): UseVisibleDayResult {
  const centerRef = useRef(
    coerceDayViewDayKey(
      centerDayKey ??
        useCalendarSelectionStore.getState().selectedDayKey ??
        toDayKey(todayCalendarDate()),
    ),
  );
  const center = centerRef.current;

  const days = useMemo(
    () => buildDayViewWindow(center, DAY_PAGER_RADIUS),
    [center],
  );

  const initialIndex = DAY_PAGER_RADIUS;
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const visibleDayKey = days[pageIndex] ?? center;

  const onPageSelected = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      setPageIndex(event.nativeEvent.position);
    },
    [],
  );

  const onPageScrollStateChanged = useCallback(
    (event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>) => {
      setIsDragging(event.nativeEvent.pageScrollState !== "idle");
    },
    [],
  );

  return {
    days,
    initialIndex,
    pageIndex,
    visibleDayKey,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  };
}
