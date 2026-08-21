import { useCallback, useMemo, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type {
  PageScrollStateChangedNativeEventData,
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEventData,
} from "react-native-pager-view";

import {
  addMonths,
  toYearMonth,
  type YearMonth,
} from "@/utils/calendar";

/** Months before/after the center month in the pager window. */
export const MONTH_PAGER_RADIUS = 120;

/** Past this page offset a drag is treated as committed to the neighbor. */
const PAGE_COMMIT_OFFSET = 0.5;

type PageScrollState = "idle" | "dragging" | "settling";

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

/** Page index a drag has crossed the halfway mark for. */
export function committedPageIndex(position: number, offset: number): number {
  return offset >= PAGE_COMMIT_OFFSET ? position + 1 : position;
}

export type UseVisibleMonthResult = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  visibleMonth: YearMonth;
  /** Month label target — updates once a swipe is committed, before settle. */
  headerMonth: YearMonth;
  isDragging: boolean;
  onPageScroll: (
    event: NativeSyntheticEvent<PagerViewOnPageScrollEventData>,
  ) => void;
  onPageSelected: (
    event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>,
  ) => void;
  onPageScrollStateChanged: (
    event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>,
  ) => void;
  setPageIndex: (index: number) => void;
};

/**
 * Tracks the settled pager page for grids, and a separate header month that
 * updates as soon as a swipe commits (halfway drag or settle direction).
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
  const [pageIndex, setPageIndexState] = useState(initialIndex);
  const [headerPageIndex, setHeaderPageIndexState] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const pageIndexRef = useRef(initialIndex);
  const headerPageIndexRef = useRef(initialIndex);
  const scrollStateRef = useRef<PageScrollState>("idle");
  const lastScrollRef = useRef({ position: initialIndex, offset: 0 });

  const visibleMonth = months[pageIndex] ?? center;
  const headerMonth = months[headerPageIndex] ?? center;

  const setHeaderPageIndex = useCallback((next: number) => {
    if (headerPageIndexRef.current === next) return;
    headerPageIndexRef.current = next;
    setHeaderPageIndexState(next);
  }, []);

  const setPageIndex = useCallback(
    (next: number) => {
      if (pageIndexRef.current !== next) {
        pageIndexRef.current = next;
        setPageIndexState(next);
      }
      setHeaderPageIndex(next);
    },
    [setHeaderPageIndex],
  );

  const onPageScroll = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageScrollEventData>) => {
      const { position, offset } = event.nativeEvent;
      const prev = lastScrollRef.current;
      lastScrollRef.current = { position, offset };

      const state = scrollStateRef.current;
      if (state === "dragging") {
        setHeaderPageIndex(committedPageIndex(position, offset));
        return;
      }

      if (state !== "settling") return;

      // Fling / snap: destination is fixed; commit from settle direction
      // even when release happens before the halfway mark.
      const progress = position + offset;
      const prevProgress = prev.position + prev.offset;
      const delta = progress - prevProgress;
      if (delta > 1e-4) {
        setHeaderPageIndex(Math.ceil(progress - 1e-6));
      } else if (delta < -1e-4) {
        setHeaderPageIndex(Math.floor(progress + 1e-6));
      }
    },
    [setHeaderPageIndex],
  );

  const onPageSelected = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      setPageIndex(event.nativeEvent.position);
    },
    [setPageIndex],
  );

  const onPageScrollStateChanged = useCallback(
    (event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>) => {
      const nextState = event.nativeEvent.pageScrollState;
      scrollStateRef.current = nextState;
      setIsDragging(nextState !== "idle");
    },
    [],
  );

  return {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    headerMonth,
    isDragging,
    onPageScroll,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  };
}
