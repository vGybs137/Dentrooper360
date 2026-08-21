import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";

import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useSelectedCalendarDay } from "@/hooks/schedule/useSelectedCalendarDay";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useThemeTokens } from "@/theme";
import {
  parseDayKey,
  toMonthKey,
  toYearMonth,
  type WeekdayIndex,
} from "@/utils/calendar";

import { DayEventsSheet } from "./DayEventsSheet";
import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { PagerShrinkProvider } from "./PagerShrinkContext";
import { PagerTransformHost } from "./PagerTransformHost";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Full-screen month calendar with horizontal paging and a day-events sheet.
 * Sheet opens only on swipe-up (max 45%); calendar visually shrinks via scaleY.
 */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const theme = useThemeTokens();
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

  const { cache, ensureVisibleWindow } = useMonthAppointmentsCache({
    fallbackColor: theme.palette.brand.default,
    isDragging,
  });

  const { selectedDayKey } = useSelectedCalendarDay();

  const sheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const animatedIndex = useSharedValue(-1);
  const animatedPosition = useSharedValue(0);
  const [pagerHostHeight, setPagerHostHeight] = useState(0);

  const dayEvents = useMemo(() => {
    const { year, month } = parseDayKey(selectedDayKey);
    const monthKey = toMonthKey({ year, month });
    return cache[monthKey]?.[selectedDayKey] ?? [];
  }, [cache, selectedDayKey]);

  useEffect(() => {
    ensureVisibleWindow(visibleMonth);
  }, [ensureVisibleWindow, visibleMonth]);

  /** Keep controlled index aligned with animation target to avoid snap-back flicker. */
  const syncSheetIndex = useCallback((next: number) => {
    setSheetIndex((prev) => (prev === next ? prev : next));
  }, []);

  const openSheet = useCallback(() => {
    syncSheetIndex(0);
    sheetRef.current?.snapToIndex(0);
  }, [syncSheetIndex]);

  const handleSheetChange = useCallback(
    (index: number) => {
      syncSheetIndex(index);
    },
    [syncSheetIndex],
  );

  const handleSheetAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      // Update before animation finishes so a parent re-render cannot re-snap to 0.
      syncSheetIndex(toIndex);
    },
    [syncSheetIndex],
  );

  const handlePagerHostLayout = useCallback((event: LayoutChangeEvent) => {
    setPagerHostHeight(event.nativeEvent.layout.height);
  }, []);

  // Vertical-only open gesture; fails on horizontal so MonthPager keeps X swipes.
  const openSheetGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(sheetIndex < 0)
        .activeOffsetY(-14)
        .failOffsetX([-18, 18])
        .onEnd((event) => {
          if (event.translationY < -36 || event.velocityY < -450) {
            runOnJS(openSheet)();
          }
        }),
    [openSheet, sheetIndex],
  );

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
      }}
    >
      <MonthCalendarHeader yearMonth={visibleMonth} />
      <WeekdayHeader weekStartsOn={weekStartsOn} />
      <View style={{ flex: 1 }}>
        <PagerShrinkProvider animatedIndex={animatedIndex}>
          <PagerTransformHost
            animatedIndex={animatedIndex}
            hostHeight={pagerHostHeight}
            onLayout={handlePagerHostLayout}
          >
            <GestureDetector gesture={openSheetGesture}>
              <View style={{ flex: 1 }}>
                <MonthPager
                  months={months}
                  initialIndex={initialIndex}
                  pageIndex={pageIndex}
                  weekStartsOn={weekStartsOn}
                  appointmentsCache={cache}
                  onPageSelected={onPageSelected}
                  onPageScrollStateChanged={onPageScrollStateChanged}
                />
              </View>
            </GestureDetector>
          </PagerTransformHost>
        </PagerShrinkProvider>

        <DayEventsSheet
          sheetRef={sheetRef}
          selectedDayKey={selectedDayKey}
          events={dayEvents}
          index={sheetIndex}
          onChange={handleSheetChange}
          onAnimate={handleSheetAnimate}
          animatedIndex={animatedIndex}
          animatedPosition={animatedPosition}
        />
      </View>
    </View>
  );
}
