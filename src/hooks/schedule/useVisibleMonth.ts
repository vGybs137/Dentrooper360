import { useCallback, useMemo, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type { PagerViewOnPageSelectedEventData } from "react-native-pager-view";

import {
  addMonths,
  toYearMonth,
  type YearMonth,
} from "@/utils/calendar";

/** Months before/after the center month in the pager window. */
export const MONTH_PAGER_RADIUS = 120;

export function buildMonthWindow(
  center: YearMonth,
  radius: number = MONTH_PAGER_RADIUS,
): YearMonth[] {
  const months: YearMonth[] = [];
  for (let offset = -radius; offset <= radius; offset++) {
    months.push(addMonths(center, offset));
  }
  return months;
}

export type UseVisibleMonthResult = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  visibleMonth: YearMonth;
  onPageSelected: (
    event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>,
  ) => void;
  setPageIndex: (index: number) => void;
};

/**
 * Tracks the settled pager page and maps it to a YearMonth.
 * Month window is frozen around the center month from first mount.
 */
export function useVisibleMonth(
  centerMonth?: YearMonth,
): UseVisibleMonthResult {
  const centerRef = useRef(centerMonth ?? toYearMonth(new Date()));
  const center = centerRef.current;

  const months = useMemo(
    () => buildMonthWindow(center, MONTH_PAGER_RADIUS),
    [center],
  );

  const initialIndex = MONTH_PAGER_RADIUS;
  const [pageIndex, setPageIndex] = useState(initialIndex);

  const visibleMonth = months[pageIndex] ?? center;

  const onPageSelected = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      setPageIndex(event.nativeEvent.position);
    },
    [],
  );

  return {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    onPageSelected,
    setPageIndex,
  };
}
