import { useMemo, useRef } from "react";

import { usePagerPageState } from "@/hooks/schedule/usePagerPageState";
import {
  buildWeekWindow,
  toDayKey,
  todayCalendarDate,
  WEEK_PAGER_RADIUS,
  weekStartDayKey,
  type DayKey,
  type WeekdayIndex,
} from "@/helpers/schedule/calendar";

export type UseVisibleWeekResult = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  visibleWeekStart: DayKey;
  isDragging: boolean;
  onPageSelected: ReturnType<typeof usePagerPageState>["onPageSelected"];
  onPageScrollStateChanged: ReturnType<
    typeof usePagerPageState
  >["onPageScrollStateChanged"];
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
  const {
    pageIndex,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  } = usePagerPageState(initialIndex);

  const visibleWeekStart = weeks[pageIndex] ?? center;

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
