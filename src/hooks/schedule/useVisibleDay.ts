import { useMemo, useRef } from "react";

import { usePagerPageState } from "@/hooks/schedule/usePagerPageState";
import { useCalendarSelectionStore } from "@/stores/calendarSelectionStore";
import {
  buildDayViewWindow,
  coerceDayViewDayKey,
  DAY_PAGER_RADIUS,
  toDayKey,
  todayCalendarDate,
  type DayKey,
} from "@/helpers/schedule/calendar";

export type UseVisibleDayResult = {
  days: DayKey[];
  initialIndex: number;
  pageIndex: number;
  visibleDayKey: DayKey;
  isDragging: boolean;
  onPageSelected: ReturnType<typeof usePagerPageState>["onPageSelected"];
  onPageScrollStateChanged: ReturnType<
    typeof usePagerPageState
  >["onPageScrollStateChanged"];
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
  const {
    pageIndex,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  } = usePagerPageState(initialIndex);

  const visibleDayKey = days[pageIndex] ?? center;

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
