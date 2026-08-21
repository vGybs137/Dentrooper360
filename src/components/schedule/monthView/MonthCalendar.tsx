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

import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useCalendarSelectionStore } from "@/stores/calendarSelectionStore";
import {
  buildMonthGrid,
  MONTH_GRID_COLS,
  MONTH_GRID_ROWS,
  parseDayKey,
  sameYearMonth,
  toYearMonth,
  type DayKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import {
  DayEventsSheet,
  type DayEventsSheetHandle,
} from "./DayEventsSheet";
import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager, type MonthPagerHandle } from "./MonthPager";
import { SheetOpenProgressContext } from "./SheetOpenProgressContext";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

function weekRowForDay(
  yearMonth: YearMonth,
  weekStartsOn: WeekdayIndex,
  dayKey: DayKey,
): number {
  const grid = buildMonthGrid(yearMonth, { weekStartsOn });
  const index = grid.cells.findIndex((cell) => cell.dayKey === dayKey);
  if (index < 0) return 0;
  return Math.floor(index / MONTH_GRID_COLS);
}

/** Full-screen month calendar with horizontal paging and day-events sheet. */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const centerMonth = toYearMonth(new Date());
  const {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleMonth(centerMonth);

  const { cache, ensureVisibleWindow, getEventsForDay } =
    useMonthAppointmentsCache({
      isDragging,
    });

  const selectedDayKey = useCalendarSelectionStore((s) => s.selectedDayKey);
  const events = getEventsForDay(selectedDayKey);

  const sheetRef = useRef<DayEventsSheetHandle>(null);
  const pagerRef = useRef<MonthPagerHandle>(null);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

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

  useEffect(() => {
    sheetSnapHeightSV.value = sheetSnapHeight;
  }, [sheetSnapHeight, sheetSnapHeightSV]);

  useEffect(() => {
    ensureVisibleWindow(visibleMonth);
  }, [ensureVisibleWindow, visibleMonth]);

  useEffect(() => {
    selectedRowSV.value = weekRowForDay(
      visibleMonth,
      weekStartsOn,
      selectedDayKey,
    );
  }, [selectedDayKey, selectedRowSV, visibleMonth, weekStartsOn]);

  const setSheetHeight = useCallback((height: number) => {
    if (isDraggingRef.current) return;
    sheetRef.current?.setHeight(height);
  }, []);

  const settleSheetOpen = useCallback(() => {
    if (isDraggingRef.current) return;
    sheetRef.current?.open();
  }, []);

  const settleSheetClosed = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleDayPress = useCallback(
    (dayKey: DayKey, alreadySelected: boolean) => {
      // First tap selects; second tap on the same day opens the sheet.
      if (alreadySelected) {
        settleSheetOpen();
        return;
      }

      const date = parseDayKey(dayKey);
      const targetMonth: YearMonth = { year: date.year, month: date.month };
      if (sameYearMonth(targetMonth, visibleMonth)) return;

      const targetIndex = months.findIndex((month) =>
        sameYearMonth(month, targetMonth),
      );
      if (targetIndex >= 0) {
        pagerRef.current?.setPage(targetIndex);
      }
    },
    [months, settleSheetOpen, visibleMonth],
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
      <View
        style={{
          flex: 1,
          width: "100%",
          alignSelf: "stretch",
        }}
        onLayout={onHostLayout}
      >
        <View onLayout={onChromeLayout}>
          <MonthCalendarHeader yearMonth={visibleMonth} />
          <WeekdayHeader weekStartsOn={weekStartsOn} />
        </View>

        <GestureDetector gesture={openSwipeGesture}>
          <View style={{ flex: 1 }} onLayout={onPagerSlotLayout}>
            <Animated.View style={weekClipStyle}>
              <Animated.View style={weekPinStyle}>
                <MonthPager
                  ref={pagerRef}
                  months={months}
                  initialIndex={initialIndex}
                  pageIndex={pageIndex}
                  weekStartsOn={weekStartsOn}
                  appointmentsCache={cache}
                  onDayPress={handleDayPress}
                  onPageSelected={onPageSelected}
                  onPageScrollStateChanged={onPageScrollStateChanged}
                />
              </Animated.View>
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
          />
        ) : null}
      </View>
    </SheetOpenProgressContext.Provider>
  );
}
