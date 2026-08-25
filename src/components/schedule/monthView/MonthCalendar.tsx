import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { MONTH_VIEW_SHEET_SWAP_PROGRESS } from "@/constants/schedule";
import { SheetOpenProgressContext } from "@/contexts/SheetOpenProgressContext";
import { weekRowForDay, yearMonthFromDayKey } from "@/helpers/scheduleCalendar";
import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useVisibleWeek } from "@/hooks/schedule/useVisibleWeek";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
} from "@/stores/calendarSelectionStore";
import type {
  DayEventsSheetHandle,
  MonthPagerHandle,
  WeekPagerHandle,
} from "@/types/schedule";
import {
  addDays,
  MONTH_GRID_ROWS,
  parseDayKey,
  sameYearMonth,
  toDayKey,
  toYearMonth,
  weekdayOffset,
  weekStartDayKey,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { DayEventsSheet } from "./DayEventsSheet";
import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { MonthQuickAddField } from "./MonthQuickAddField";
import { WeekdayHeader } from "./WeekdayHeader";
import { WeekPager } from "./WeekPager";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Full-screen month calendar with horizontal paging and day-events sheet. */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const centerMonth = toYearMonth(new Date());
  const {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    headerMonth: pagerHeaderMonth,
    isDragging: isMonthDragging,
    onPageScroll,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex: setMonthPageIndex,
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

  /**
   * While the sheet is settled open, freeze the month pager on the last cache
   * snapshot so appointment writes don't rebuild its page tree (opacity 0).
   * Week pager keeps the live cache for chips/dots + sheet list.
   */
  const frozenMonthCacheRef = useRef(cache);
  if (!sheetOpen) {
    frozenMonthCacheRef.current = cache;
  }
  const monthPagerCache = sheetOpen ? frozenMonthCacheRef.current : cache;
  const selectedMonthKey = selectedDayKey.slice(0, 7);
  const headerMonth = useMemo(() => {
    if (!sheetOpen) return pagerHeaderMonth;
    const [year, month] = selectedMonthKey.split("-").map(Number);
    return { year, month: month - 1 };
  }, [pagerHeaderMonth, selectedMonthKey, sheetOpen]);
  const headerMonthKey = `${headerMonth.year}-${headerMonth.month}`;

  const sheetRef = useRef<DayEventsSheetHandle>(null);
  const pagerRef = useRef<MonthPagerHandle>(null);
  const weekPagerRef = useRef<WeekPagerHandle>(null);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const selectedDayKeyRef = useRef(selectedDayKey);
  selectedDayKeyRef.current = selectedDayKey;
  const weekPageIndexRef = useRef(weekPageIndex);
  weekPageIndexRef.current = weekPageIndex;
  const monthPageIndexRef = useRef(pageIndex);
  monthPageIndexRef.current = pageIndex;
  const sheetOpenRef = useRef(sheetOpen);
  sheetOpenRef.current = sheetOpen;

  const animatedIndex = useSharedValue(-1);
  const animatedPosition = useSharedValue(0);
  const pagerHeightSV = useSharedValue(0);
  const sheetSnapHeightSV = useSharedValue(0);
  const selectedRowSV = useSharedValue(
    weekRowForDay(visibleMonth, weekStartsOn, selectedDayKey),
  );
  /** 0–1 open amount while the calendar swipe is actively driving the sheet. */
  const dragProgressSV = useSharedValue(0);
  const calendarDragActiveSV = useSharedValue(0);
  /** Same 0–1 progress used for week pin + chip/dot crossfade (UI thread only). */
  const sheetOpenProgressSV = useSharedValue(0);

  const [hostHeight, setHostHeight] = useState(0);
  const [chromeHeight, setChromeHeight] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);

  /** Sheet fills everything below header + weekday + the pinned week row. */
  const sheetSnapHeight = useMemo(() => {
    if (hostHeight <= 0 || pagerHeight <= 0) return 0;
    const weekHeight = pagerHeight / MONTH_GRID_ROWS;
    return Math.max(0, Math.round(hostHeight - chromeHeight - weekHeight));
  }, [chromeHeight, hostHeight, pagerHeight]);

  const weekSlotHeight = useMemo(() => {
    if (pagerHeight <= 0) return 0;
    return pagerHeight / MONTH_GRID_ROWS;
  }, [pagerHeight]);

  useEffect(() => {
    sheetSnapHeightSV.value = sheetSnapHeight;
  }, [sheetSnapHeight, sheetSnapHeightSV]);

  useEffect(() => {
    ensureVisibleWindow(headerMonth);
  }, [ensureVisibleWindow, headerMonth, headerMonthKey]);

  useEffect(() => {
    selectedRowSV.value = weekRowForDay(
      visibleMonth,
      weekStartsOn,
      selectedDayKey,
    );
  }, [selectedDayKey, selectedRowSV, visibleMonth, weekStartsOn]);

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
      // Update ref immediately so open animation never briefly shows the old week.
      weekPageIndexRef.current = targetIndex;
      setWeekPageIndex(targetIndex);
      weekPagerRef.current?.setPageWithoutAnimation(targetIndex);
    },
    [setWeekPageIndex, weekStartsOn, weeks],
  );

  // Keep week pager aligned while the sheet is closed so reopen doesn't flash the prior week.
  useEffect(() => {
    if (sheetOpen) return;
    syncWeekPagerToDay(selectedDayKey);
  }, [selectedDayKey, sheetOpen, syncWeekPagerToDay]);

  const setSheetHeight = useCallback((height: number) => {
    if (isDraggingRef.current) return;
    sheetRef.current?.setHeight(height);
  }, []);

  const settleSheetOpen = useCallback(() => {
    if (isDraggingRef.current) return;
    syncWeekPagerToDay(selectedDayKeyRef.current);
    sheetRef.current?.open();
  }, [syncWeekPagerToDay]);

  const settleSheetClosed = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (open) {
        syncWeekPagerToDay(selectedDayKeyRef.current);
      } else {
        syncMonthPagerToDay(selectedDayKeyRef.current);
      }
    },
    [syncMonthPagerToDay, syncWeekPagerToDay],
  );

  const handleDayPress = useCallback(
    (dayKey: DayKey, alreadySelected: boolean) => {
      // First tap selects; second tap on the same day opens the sheet.
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
        setMonthPageIndex(targetIndex);
        pagerRef.current?.setPage(targetIndex);
      }
    },
    [months, setMonthPageIndex, settleSheetOpen, visibleMonth],
  );

  /** Sheet already open: tap only changes the selected day (and sheet list). */
  const handleWeekDayPress = useCallback(
    (dayKey: DayKey, _alreadySelected: boolean) => {
      // DayCell already called selectCalendarDay; keep month pager in sync
      // when the tap lands on an adjacent-month day in this week.
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

  const onHostLayout = useCallback((event: LayoutChangeEvent) => {
    setHostHeight(event.nativeEvent.layout.height);
  }, []);

  const onChromeLayout = useCallback((event: LayoutChangeEvent) => {
    setChromeHeight(event.nativeEvent.layout.height);
  }, []);

  const onPagerSlotLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      pagerHeightSV.value = next;
      setPagerHeight(next);
    },
    [pagerHeightSV],
  );

  useAnimatedReaction(
    () => {
      const fromSheet = interpolate(
        animatedIndex.value,
        [-1, 0],
        [0, 1],
        Extrapolation.CLAMP,
      );
      return calendarDragActiveSV.value > 0 ? dragProgressSV.value : fromSheet;
    },
    (progress) => {
      sheetOpenProgressSV.value = progress;
    },
  );

  /**
   * While the calendar swipe is active, follow the finger.
   * Otherwise follow the sheet's animatedIndex so open/close stay in sync.
   * Progress is computed inline (not via sheetOpenProgressSV) to keep week pin smooth.
   */
  const weekClipStyle = useAnimatedStyle(() => {
    const fromSheet = interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const progress =
      calendarDragActiveSV.value > 0 ? dragProgressSV.value : fromSheet;
    const full = Math.max(pagerHeightSV.value, 1);
    const week = full / MONTH_GRID_ROWS;
    return {
      height: interpolate(progress, [0, 1], [full, week]),
      overflow: "hidden" as const,
    };
  });

  const weekPinStyle = useAnimatedStyle(() => {
    const fromSheet = interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const progress =
      calendarDragActiveSV.value > 0 ? dragProgressSV.value : fromSheet;
    const full = Math.max(pagerHeightSV.value, 1);
    const week = full / MONTH_GRID_ROWS;
    return {
      height: full,
      transform: [{ translateY: -selectedRowSV.value * week * progress }],
    };
  });

  /**
   * Week pager only when fully open; month grid otherwise.
   * Instant swap (no crossfade) so open/close expand stays crisp.
   */
  const monthPagerVisibilityStyle = useAnimatedStyle(() => {
    const fromSheet = interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const progress =
      calendarDragActiveSV.value > 0 ? dragProgressSV.value : fromSheet;
    return {
      opacity: progress >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 0 : 1,
    };
  });

  const weekPagerVisibilityStyle = useAnimatedStyle(() => {
    const fromSheet = interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const progress =
      calendarDragActiveSV.value > 0 ? dragProgressSV.value : fromSheet;
    return {
      opacity: progress >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 1 : 0,
    };
  });

  const weekOverlayStyle = useMemo(
    () => ({
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      height: weekSlotHeight,
    }),
    [weekSlotHeight],
  );

  const openSwipeGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-20, 20])
    .onUpdate((event) => {
      const snap = sheetSnapHeightSV.value;
      if (snap <= 0) return;
      calendarDragActiveSV.value = 1;
      const height = Math.min(snap, Math.max(0, -event.translationY));
      dragProgressSV.value = height / snap;
      scheduleOnRN(setSheetHeight, height);
    })
    .onEnd((event) => {
      const snap = sheetSnapHeightSV.value;
      if (snap <= 0) {
        calendarDragActiveSV.value = 0;
        return;
      }
      const height = Math.min(snap, Math.max(0, -event.translationY));
      const progress = height / snap;
      const shouldOpen = progress > 0.2 || event.velocityY < -800;
      // Hand off to the sheet animation so the week restores/collapses with it.
      calendarDragActiveSV.value = 0;
      if (shouldOpen) {
        scheduleOnRN(settleSheetOpen);
      } else {
        scheduleOnRN(settleSheetClosed);
      }
    })
    .onFinalize(() => {
      calendarDragActiveSV.value = 0;
    });

  return (
    <SheetOpenProgressContext.Provider value={sheetOpenProgressSV}>
      <View className="w-full flex-1 self-stretch">
        {/* Calendar host only — quick-add sits below so sheet snap excludes it. */}
        <View className="w-full flex-1" onLayout={onHostLayout}>
          <View onLayout={onChromeLayout}>
            <MonthCalendarHeader yearMonth={headerMonth} />
            <WeekdayHeader weekStartsOn={weekStartsOn} />
          </View>

          <GestureDetector gesture={openSwipeGesture}>
            <View className="flex-1" onLayout={onPagerSlotLayout}>
              <Animated.View style={weekClipStyle}>
                <Animated.View
                  pointerEvents={sheetOpen ? "none" : "auto"}
                  style={[weekPinStyle, monthPagerVisibilityStyle]}
                >
                  <MonthPager
                    ref={pagerRef}
                    months={months}
                    initialIndex={initialIndex}
                    pageIndex={pageIndex}
                    weekStartsOn={weekStartsOn}
                    appointmentsCache={monthPagerCache}
                    scrollEnabled={!sheetOpen}
                    onDayPress={handleDayPress}
                    onPageScroll={onPageScroll}
                    onPageSelected={onPageSelected}
                    onPageScrollStateChanged={onPageScrollStateChanged}
                  />
                </Animated.View>

                {weekSlotHeight > 0 ? (
                  <Animated.View
                    pointerEvents={sheetOpen ? "auto" : "none"}
                    style={[weekOverlayStyle, weekPagerVisibilityStyle]}
                  >
                    <WeekPager
                      ref={weekPagerRef}
                      weeks={weeks}
                      initialIndex={weekInitialIndex}
                      pageIndex={weekPageIndex}
                      appointmentsCache={cache}
                      scrollEnabled={sheetOpen}
                      onDayPress={handleWeekDayPress}
                      onPageSelected={handleWeekPageSelected}
                      onPageScrollStateChanged={onWeekPageScrollStateChanged}
                    />
                  </Animated.View>
                ) : null}
              </Animated.View>
            </View>
          </GestureDetector>

          {sheetSnapHeight > 0 ? (
            <DayEventsSheet
              ref={sheetRef}
              dayKey={selectedDayKey}
              events={events}
              snapHeight={sheetSnapHeight}
              animatedIndex={animatedIndex}
              animatedPosition={animatedPosition}
              onOpenChange={handleSheetOpenChange}
            />
          ) : null}
        </View>

        <MonthQuickAddField dayKey={selectedDayKey} events={events} />
      </View>
    </SheetOpenProgressContext.Provider>
  );
}
