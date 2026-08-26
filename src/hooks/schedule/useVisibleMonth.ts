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

/**
 * Destination page from scroll direction (same idea as jumping the header on
 * out-of-month tap: set header to the target as soon as direction is known).
 */
export function headerIndexFromScrollDirection(
  prevProgress: number,
  progress: number,
): number | null {
  const delta = progress - prevProgress;
  if (delta > 1e-4) return Math.ceil(progress - 1e-6);
  if (delta < -1e-4) return Math.floor(progress + 1e-6);
  return null;
}

export type UseVisibleMonthResult = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  visibleMonth: YearMonth;
  /** Month label — driven by headerPageIndex, not settled pageIndex. */
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
  /**
   * Jump the header label without remounting pager grids.
   * Used for out-of-month taps; scroll uses the same path via direction commits.
   */
  setHeaderPageIndex: (index: number) => void;
};

/**
 * Tracks the settled pager page for grids, and a separate header month that
 * jumps to the destination as soon as swipe direction (or a tap target) is known.
 * pageIndex also tracks scroll progress while dragging/settling so fast flings
 * keep neighbor MonthGrids mounted (render radius 1).
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

  /** Mount nearby grids from scroll position without touching the header. */
  const setRenderPageIndex = useCallback((next: number) => {
    if (pageIndexRef.current === next) return;
    pageIndexRef.current = next;
    setPageIndexState(next);
  }, []);

  const setPageIndex = useCallback(
    (next: number) => {
      setRenderPageIndex(next);
      setHeaderPageIndex(next);
    },
    [setHeaderPageIndex, setRenderPageIndex],
  );

  const onPageScroll = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageScrollEventData>) => {
      const { position, offset } = event.nativeEvent;
      const prev = lastScrollRef.current;
      const prevProgress = prev.position + prev.offset;
      const progress = position + offset;
      lastScrollRef.current = { position, offset };

      // Keep render window under the finger during fast multi-page flings.
      setRenderPageIndex(Math.round(progress));

      const state = scrollStateRef.current;
      if (state === "dragging") {
        setHeaderPageIndex(committedPageIndex(position, offset));
        return;
      }

      // Settling / programmatic setPage: jump header to destination from direction.
      // Large progress jumps (quick fling) snap header to the rounded page.
      if (Math.abs(progress - prevProgress) > 0.45) {
        setHeaderPageIndex(Math.round(progress));
        return;
      }

      const directed = headerIndexFromScrollDirection(prevProgress, progress);
      if (directed != null) {
        setHeaderPageIndex(directed);
        return;
      }
      setHeaderPageIndex(committedPageIndex(position, offset));
    },
    [setHeaderPageIndex, setRenderPageIndex],
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
      const prevState = scrollStateRef.current;
      scrollStateRef.current = nextState;
      setIsDragging(nextState !== "idle");

      if (nextState === "settling" && prevState !== "settling") {
        const { position, offset } = lastScrollRef.current;
        const progress = position + offset;
        const from = pageIndexRef.current;
        setRenderPageIndex(Math.round(progress));

        if (Math.abs(progress - from) > 0.45) {
          setHeaderPageIndex(Math.round(progress));
        } else if (progress > from + 1e-4) {
          setHeaderPageIndex(Math.ceil(progress - 1e-6));
        } else if (progress < from - 1e-4) {
          setHeaderPageIndex(Math.floor(progress + 1e-6));
        } else if (prevState === "dragging") {
          setHeaderPageIndex(committedPageIndex(position, offset));
        }
      }
    },
    [setHeaderPageIndex, setRenderPageIndex],
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
    setHeaderPageIndex,
  };
}
