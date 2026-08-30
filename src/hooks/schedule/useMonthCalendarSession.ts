import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";

import { yearMonthFromDayKey } from "@/helpers/scheduleCalendar";
import { useDayEventsSheetProgress } from "@/hooks/schedule/useDayEventsSheetProgress";
import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useVisibleWeek } from "@/hooks/schedule/useVisibleWeek";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
} from "@/stores/calendarSelectionStore";
import type {
  MonthPagerHandle,
  WeekPagerHandle,
} from "@/types/schedule";
import {
  addDays,
  parseDayKey,
  sameYearMonth,
  toDayKey,
  toYearMonth,
  weekdayOffset,
  weekStartDayKey,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import type { DayCellEventIndicators } from "@/components/schedule/monthView/DayCell";

export type UseMonthCalendarSessionOptions = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Month pager / week pager / day-events sheet session: selection, cache window,
 * and press/swipe handling. Layout styles live in useMonthSheetGeometry.
 */
export function useMonthCalendarSession({
  weekStartsOn = 0,
}: UseMonthCalendarSessionOptions) {
  const centerMonth = toYearMonth(new Date());
  const {
    months,
    initialIndex,
    pageIndex,
    mountPageIndex,
    visibleMonth,
    headerMonth: pagerHeaderMonth,
    isDragging: isMonthDragging,
    pageScrollHandler,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex: setMonthPageIndex,
    setHeaderPageIndex: setMonthHeaderPageIndex,
  } = useVisibleMonth(centerMonth);

  const {
    weeks,
    initialIndex: weekInitialIndex,
    pageIndex: weekPageIndex,
    isDragging: isWeekDragging,
    onPageSelected: onWeekPageSelectedBase,
    onPageScrollStateChanged: onWeekPageScrollStateChanged,
    setPageIndex: setWeekPageIndex,
  } = useVisibleWeek(weekStartsOn);

  const isDragging = isMonthDragging || isWeekDragging;

  const { cache, ensureVisibleWindow, getEventsForDay } =
    useMonthAppointmentsCache({
      isDragging,
    });

  const selectedDayKey = useCalendarSelectionStore((s) => s.selectedDayKey);
  const events = getEventsForDay(selectedDayKey);

  const [sheetOpen, setSheetOpen] = useState(false);
  /** True while dragging or springing — enables chip↔dot crossfade worklets. */
  const [sheetMotionActive, setSheetMotionActive] = useState(false);

  /**
   * While the sheet is settled open, freeze the month pager on the last cache
   * snapshot so appointment writes don't rebuild its page tree (opacity 0).
   */
  const frozenMonthCacheRef = useRef(cache);
  if (!sheetOpen) {
    frozenMonthCacheRef.current = cache;
  }
  const monthPagerCache = sheetOpen ? frozenMonthCacheRef.current : cache;
  const headerMonth = useMemo(() => {
    if (!sheetOpen) return pagerHeaderMonth;
    return yearMonthFromDayKey(selectedDayKey);
  }, [pagerHeaderMonth, selectedDayKey, sheetOpen]);
  const headerMonthKey = `${headerMonth.year}-${headerMonth.month}`;

  const pagerRef = useRef<MonthPagerHandle>(null);
  const weekPagerRef = useRef<WeekPagerHandle>(null);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const selectedDayKeyRef = useRef(selectedDayKey);
  selectedDayKeyRef.current = selectedDayKey;
  const weekPageIndexRef = useRef(weekPageIndex);
  weekPageIndexRef.current = weekPageIndex;
  const monthPageIndexRef = useRef(mountPageIndex);
  monthPageIndexRef.current = mountPageIndex;
  const sheetOpenRef = useRef(sheetOpen);
  sheetOpenRef.current = sheetOpen;

  const syncMonthPagerToDay = useCallback(
    (dayKey: DayKey) => {
      const targetMonth = yearMonthFromDayKey(dayKey);
      const targetIndex = months.findIndex((month) =>
        sameYearMonth(month, targetMonth),
      );
      if (targetIndex < 0 || targetIndex === monthPageIndexRef.current) return;
      setMonthPageIndex(targetIndex);
      pagerRef.current?.setPageWithoutAnimation(targetIndex);
    },
    [months, setMonthPageIndex],
  );

  const syncWeekPagerToDay = useCallback(
    (dayKey: DayKey) => {
      const targetWeek = weekStartDayKey(dayKey, weekStartsOn);
      const targetIndex = weeks.findIndex((week) => week === targetWeek);
      if (targetIndex < 0 || targetIndex === weekPageIndexRef.current) return;
      weekPageIndexRef.current = targetIndex;
      setWeekPageIndex(targetIndex);
      weekPagerRef.current?.setPageWithoutAnimation(targetIndex);
    },
    [setWeekPageIndex, weekStartsOn, weeks],
  );

  const handleSettledOpen = useCallback(() => {
    setSheetOpen(true);
    setSheetMotionActive(false);
    syncWeekPagerToDay(selectedDayKeyRef.current);
  }, [syncWeekPagerToDay]);

  const handleSettledClosed = useCallback(() => {
    setSheetOpen(false);
    setSheetMotionActive(false);
    syncMonthPagerToDay(selectedDayKeyRef.current);
  }, [syncMonthPagerToDay]);

  const handleMotionStart = useCallback(() => {
    setSheetMotionActive(true);
  }, []);

  const {
    openProgress,
    setSnapHeight,
    sheetAnimatedStyle,
    sheetAnimatedProps,
    beginDrag,
    applyDragTranslation,
    endDrag,
    open: openSheet,
    close: closeSheet,
  } = useDayEventsSheetProgress({
    onSettledOpen: handleSettledOpen,
    onSettledClosed: handleSettledClosed,
    onMotionStart: handleMotionStart,
  });

  useEffect(() => {
    ensureVisibleWindow(headerMonth);
  }, [ensureVisibleWindow, headerMonth, headerMonthKey]);

  // Keep week pager aligned while the sheet is closed so reopen doesn't flash the prior week.
  useEffect(() => {
    if (sheetOpen) return;
    syncWeekPagerToDay(selectedDayKey);
  }, [selectedDayKey, sheetOpen, syncWeekPagerToDay]);

  const settleSheetOpen = useCallback(() => {
    if (isDraggingRef.current) return;
    syncWeekPagerToDay(selectedDayKeyRef.current);
    openSheet();
  }, [openSheet, syncWeekPagerToDay]);

  const handleDayPress = useCallback(
    (dayKey: DayKey, alreadySelected: boolean) => {
      if (alreadySelected) {
        settleSheetOpen();
        return;
      }

      const targetMonth = yearMonthFromDayKey(dayKey);
      if (sameYearMonth(targetMonth, visibleMonth)) return;

      const targetIndex = months.findIndex((month) =>
        sameYearMonth(month, targetMonth),
      );
      if (targetIndex >= 0) {
        // Same as scroll-direction commits: jump header now, animate pager,
        // let onPageSelected sync pageIndex (avoids remounting grids early).
        setMonthHeaderPageIndex(targetIndex);
        pagerRef.current?.setPage(targetIndex);
      }
    },
    [months, setMonthHeaderPageIndex, settleSheetOpen, visibleMonth],
  );

  const handleWeekDayPress = useCallback(
    (dayKey: DayKey, _alreadySelected: boolean) => {
      syncMonthPagerToDay(dayKey);
    },
    [syncMonthPagerToDay],
  );

  const handleWeekPageSelected = useCallback(
    (event: Parameters<typeof onWeekPageSelectedBase>[0]) => {
      const nextIndex = event.nativeEvent.position;
      const prevIndex = weekPageIndexRef.current;
      onWeekPageSelectedBase(event);

      if (!sheetOpenRef.current || nextIndex === prevIndex) return;

      const selected = parseDayKey(selectedDayKeyRef.current);
      const column = weekdayOffset(selected, weekStartsOn);
      const nextWeekStart = weeks[nextIndex];
      if (!nextWeekStart) return;

      const nextDayKey = toDayKey(addDays(parseDayKey(nextWeekStart), column));
      selectCalendarDay(nextDayKey);
      syncMonthPagerToDay(nextDayKey);
    },
    [onWeekPageSelectedBase, syncMonthPagerToDay, weekStartsOn, weeks],
  );

  // Keep crossfade for the whole open session so close can animate dots→chips
  // without a blank gap (settled "none"/"dots" remount races scheduleOnRN).
  // Settled closed uses static chips (no progress worklets).
  const monthEventIndicators: DayCellEventIndicators =
    sheetOpen || sheetMotionActive ? "crossfade" : "chips";

  const openSwipeGesture = Gesture.Pan()
    // Only pull-up opens the sheet; don't claim downward / tiny taps.
    .activeOffsetY(-16)
    .failOffsetX([-24, 24])
    // Do NOT key off sheetMotionActive — beginDrag sets that true and would
    // disable this gesture mid-pan (dropped touches / double-tap day cells).
    .enabled(!sheetOpen)
    .onStart(() => {
      beginDrag();
    })
    .onUpdate((event) => {
      applyDragTranslation(event.translationY);
    })
    .onEnd((event) => {
      endDrag(event.velocityY);
    });

  return {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    headerMonth,
    pageScrollHandler,
    onPageSelected,
    onPageScrollStateChanged,
    weeks,
    weekInitialIndex,
    weekPageIndex,
    onWeekPageScrollStateChanged,
    cache,
    monthPagerCache,
    selectedDayKey,
    events,
    sheetOpen,
    sheetMotionActive,
    pagerRef,
    weekPagerRef,
    openProgress,
    setSnapHeight,
    sheetAnimatedStyle,
    sheetAnimatedProps,
    beginDrag,
    applyDragTranslation,
    endDrag,
    openSheet,
    closeSheet,
    handleDayPress,
    handleWeekDayPress,
    handleWeekPageSelected,
    monthEventIndicators,
    openSwipeGesture,
  };
}
