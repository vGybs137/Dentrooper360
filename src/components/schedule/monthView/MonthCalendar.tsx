import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { DayEventsSheet } from "@/components/schedule/dayEventsSheet";
import { MONTH_VIEW_SHEET_SWAP_PROGRESS } from "@/constants/schedule";
import { SheetOpenProgressContext } from "@/contexts/SheetOpenProgressContext";
import { weekRowForDay, yearMonthFromDayKey } from "@/helpers/scheduleCalendar";
import { useDayEventsSheetProgress } from "@/hooks/schedule/useDayEventsSheetProgress";
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

import type { DayCellEventIndicators } from "./DayCell";
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

  const pagerHeightSV = useSharedValue(0);
  const selectedRowSV = useSharedValue(
    weekRowForDay(visibleMonth, weekStartsOn, selectedDayKey),
  );

  const [hostHeight, setHostHeight] = useState(0);
  const [chromeHeight, setChromeHeight] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);

  const sheetSnapHeight = useMemo(() => {
    if (hostHeight <= 0 || pagerHeight <= 0) return 0;
    const weekHeight = pagerHeight / MONTH_GRID_ROWS;
    return Math.max(0, Math.round(hostHeight - chromeHeight - weekHeight));
  }, [chromeHeight, hostHeight, pagerHeight]);

  const weekSlotHeight = useMemo(() => {
    if (pagerHeight <= 0) return 0;
    return pagerHeight / MONTH_GRID_ROWS;
  }, [pagerHeight]);

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
    setSnapHeight(sheetSnapHeight);
  }, [setSnapHeight, sheetSnapHeight]);

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

  const weekClipStyle = useAnimatedStyle(() => {
    const progress = openProgress.value;
    const full = Math.max(pagerHeightSV.value, 1);
    const week = full / MONTH_GRID_ROWS;
    return {
      height: interpolate(progress, [0, 1], [full, week]),
      overflow: "hidden" as const,
    };
  });

  const weekPinStyle = useAnimatedStyle(() => {
    const progress = openProgress.value;
    const full = Math.max(pagerHeightSV.value, 1);
    const week = full / MONTH_GRID_ROWS;
    return {
      height: full,
      transform: [{ translateY: -selectedRowSV.value * week * progress }],
    };
  });

  const monthPagerVisibilityStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 0 : 1,
  }));

  const weekPagerVisibilityStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 1 : 0,
  }));

  // Touch targets follow visibility (openProgress), not sheetOpen. sheetOpen stays
  // true until the close spring settles — using it left the visible month
  // non-interactive so the first tap after close hit the invisible week/sheet.
  const monthTouchProps = useAnimatedProps(() => ({
    pointerEvents:
      openProgress.value < MONTH_VIEW_SHEET_SWAP_PROGRESS
        ? ("auto" as const)
        : ("none" as const),
  }));

  const weekTouchProps = useAnimatedProps(() => ({
    pointerEvents:
      openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS
        ? ("auto" as const)
        : ("none" as const),
  }));

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

  return (
    <SheetOpenProgressContext.Provider value={openProgress}>
      <View className="w-full flex-1 self-stretch">
        {/* Clip the closed sheet so its chrome can't paint under Quick Add / tabs. */}
        <View className="w-full flex-1 overflow-hidden" onLayout={onHostLayout}>
          <View onLayout={onChromeLayout}>
            <MonthCalendarHeader yearMonth={headerMonth} />
            <WeekdayHeader weekStartsOn={weekStartsOn} />
          </View>

          <View className="flex-1 overflow-hidden" onLayout={onPagerSlotLayout}>
            <GestureDetector gesture={openSwipeGesture}>
              <Animated.View style={weekClipStyle}>
                <Animated.View
                  animatedProps={monthTouchProps}
                  style={[weekPinStyle, monthPagerVisibilityStyle]}
                >
                  <MonthPager
                    ref={pagerRef}
                    months={months}
                    initialIndex={initialIndex}
                    pageIndex={pageIndex}
                    weekStartsOn={weekStartsOn}
                    appointmentsCache={monthPagerCache}
                    eventIndicators={monthEventIndicators}
                    scrollEnabled={!sheetOpen}
                    onDayPress={handleDayPress}
                    onPageScroll={onPageScroll}
                    onPageSelected={onPageSelected}
                    onPageScrollStateChanged={onPageScrollStateChanged}
                  />
                </Animated.View>

                {weekSlotHeight > 0 ? (
                  <Animated.View
                    animatedProps={weekTouchProps}
                    style={[weekOverlayStyle, weekPagerVisibilityStyle]}
                  >
                    <WeekPager
                      ref={weekPagerRef}
                      weeks={weeks}
                      initialIndex={weekInitialIndex}
                      pageIndex={weekPageIndex}
                      appointmentsCache={cache}
                      eventIndicators="dots"
                      scrollEnabled={sheetOpen}
                      onDayPress={handleWeekDayPress}
                      onPageSelected={handleWeekPageSelected}
                      onPageScrollStateChanged={onWeekPageScrollStateChanged}
                    />
                  </Animated.View>
                ) : null}
              </Animated.View>
            </GestureDetector>

            <DayEventsSheet
              ref={sheetRef}
              dayKey={selectedDayKey}
              events={events}
              snapHeight={sheetSnapHeight}
              sheetAnimatedStyle={sheetAnimatedStyle}
              sheetAnimatedProps={sheetAnimatedProps}
              beginDrag={beginDrag}
              applyDragTranslation={applyDragTranslation}
              endDrag={endDrag}
              open={openSheet}
              close={closeSheet}
            />
          </View>
        </View>

        <MonthQuickAddField dayKey={selectedDayKey} events={events} />
      </View>
    </SheetOpenProgressContext.Provider>
  );
}
