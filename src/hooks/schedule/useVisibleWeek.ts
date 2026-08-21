import { useCallback, useMemo, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type {
  PageScrollStateChangedNativeEventData,
  PagerViewOnPageSelectedEventData,
} from "react-native-pager-view";

import {
  buildWeekWindow,
  toDayKey,
  todayCalendarDate,
  WEEK_PAGER_RADIUS,
  weekStartDayKey,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

export type UseVisibleWeekResult = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  visibleWeekStart: DayKey;
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
 * Tracks the settled week pager page.
 * Week window is frozen around the center week from first mount.
 */
export function useVisibleWeek(
  weekStartsOn: WeekdayIndex = 0,
  centerDayKey?: DayKey,
): UseVisibleWeekResult {
  const centerRef = useRef(
    weekStartDayKey(
      centerDayKey ?? toDayKey(todayCalendarDate()),
      weekStartsOn,
    ),
  );
  const center = centerRef.current;

  const weeks = useMemo(
    () => buildWeekWindow(center, WEEK_PAGER_RADIUS),
    [center],
  );

  const initialIndex = WEEK_PAGER_RADIUS;
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const visibleWeekStart = weeks[pageIndex] ?? center;

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
    weeks,
    initialIndex,
    pageIndex,
    visibleWeekStart,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  };
}
