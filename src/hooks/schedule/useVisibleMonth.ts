import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NativeSyntheticEvent } from "react-native";
import type {
  PageScrollStateChangedNativeEventData,
  PagerViewOnPageSelectedEventData,
} from "react-native-pager-view";
import { runOnJS, useSharedValue } from "react-native-reanimated";

import {
  addMonths,
  toYearMonth,
  type YearMonth,
} from "@/utils/calendar";

import { usePagerScrollHandler } from "@/hooks/schedule/usePagerScrollHandler";

/** Months before/after the center month in the pager window. */
export const MONTH_PAGER_RADIUS = 120;

/** Rounded pager progress → month window index. */
export function pageIndexFromScrollProgress(
  position: number,
  offset: number,
): number {
  return Math.round(position + offset);
}

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
  /** Deferred center for grid mounting — lags during fast swipes. */
  pageIndex: number;
  /** Immediate center for pager refs / programmatic sync. */
  mountPageIndex: number;
  visibleMonth: YearMonth;
  /** Month label — follows scroll progress, with optional tap-ahead override. */
  headerMonth: YearMonth;
  isDragging: boolean;
  /** UI-thread scroll handler — pass to Animated PagerView. */
  pageScrollHandler: ReturnType<typeof usePagerScrollHandler>;
  onPageSelected: (
    event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>,
  ) => void;
  onPageScrollStateChanged: (
    event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>,
  ) => void;
  setPageIndex: (index: number) => void;
  /**
   * Jump the header label without remounting pager grids.
   * Used for out-of-month taps while the pager animates to the target page.
   */
  setHeaderPageIndex: (index: number) => void;
};

/**
 * Header index updates eagerly from scroll progress; grid mount index is
 * deferred so rebuilding 240+ pager pages cannot block the month title.
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
  const [headerPageIndex, setHeaderPageIndexState] = useState(initialIndex);
  const [mountPageIndex, setMountPageIndexState] = useState(initialIndex);
  const deferredMountPageIndex = useDeferredValue(mountPageIndex);
  const [headerOverrideIndex, setHeaderOverrideIndex] = useState<number | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const headerPageIndexRef = useRef(initialIndex);
  const mountPageIndexRef = useRef(initialIndex);
  const headerOverrideIndexRef = useRef<number | null>(null);
  const lastScrollEventIdRef = useRef(0);
  const scrollStateRef = useRef<"idle" | "dragging" | "settling">("idle");
  const scrollEventId = useSharedValue(0);

  const headerPageIndexEffective = headerOverrideIndex ?? headerPageIndex;
  const headerMonth = months[headerPageIndexEffective] ?? center;
  const visibleMonth = months[headerPageIndex] ?? center;

  const clearHeaderOverride = useCallback(() => {
    headerOverrideIndexRef.current = null;
    setHeaderOverrideIndex(null);
  }, []);

  const setPageIndex = useCallback(
    (next: number) => {
      clearHeaderOverride();
      scrollEventId.value += 1;
      lastScrollEventIdRef.current = scrollEventId.value;
      headerPageIndexRef.current = next;
      mountPageIndexRef.current = next;
      setHeaderPageIndexState(next);
      setMountPageIndexState(next);
    },
    [clearHeaderOverride, scrollEventId],
  );

  const applyHeaderFromScroll = useCallback(
    (position: number, offset: number) => {
      const index = pageIndexFromScrollProgress(position, offset);
      if (headerPageIndexRef.current !== index) {
        headerPageIndexRef.current = index;
        setHeaderPageIndexState(index);
      }

      const override = headerOverrideIndexRef.current;
      if (override != null && index === override) {
        clearHeaderOverride();
      }
    },
    [clearHeaderOverride],
  );

  const applyMountFromScroll = useCallback((position: number, offset: number) => {
    const index = pageIndexFromScrollProgress(position, offset);
    if (mountPageIndexRef.current !== index) {
      mountPageIndexRef.current = index;
      setMountPageIndexState(index);
    }
  }, []);

  const setHeaderPageIndex = useCallback((next: number) => {
    headerOverrideIndexRef.current = next;
    setHeaderOverrideIndex(next);
  }, []);

  const syncScrollProgress = useCallback(
    (position: number, offset: number, eventId: number) => {
      if (scrollStateRef.current === "idle") return;
      if (eventId <= lastScrollEventIdRef.current) return;
      lastScrollEventIdRef.current = eventId;
      applyHeaderFromScroll(position, offset);
      applyMountFromScroll(position, offset);
    },
    [applyHeaderFromScroll, applyMountFromScroll],
  );

  const pageScrollHandler = usePagerScrollHandler(
    {
      onPageScroll: (event) => {
        "worklet";
        scrollEventId.value += 1;
        runOnJS(syncScrollProgress)(
          event.position,
          event.offset,
          scrollEventId.value,
        );
      },
    },
    [scrollEventId, syncScrollProgress],
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

      if (nextState === "dragging") {
        clearHeaderOverride();
      }

      if (nextState === "idle") {
        clearHeaderOverride();
      }
    },
    [clearHeaderOverride],
  );

  return {
    months,
    initialIndex,
    pageIndex: deferredMountPageIndex,
    mountPageIndex,
    visibleMonth,
    headerMonth,
    isDragging,
    pageScrollHandler,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
    setHeaderPageIndex,
  };
}
