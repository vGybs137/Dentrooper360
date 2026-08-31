import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useNativeColors } from "@/theme";

import { DayEventsSheet } from "@/components/schedule/dayEventsSheet";
import { SheetOpenProgressContext } from "@/contexts/SheetOpenProgressContext";
import { useMonthCalendarSession } from "@/hooks/schedule/useMonthCalendarSession";
import { useMonthSheetGeometry } from "@/hooks/schedule/useMonthSheetGeometry";
import type { WeekdayIndex } from "@/utils/calendar";

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
  const native = useNativeColors();
  const session = useMonthCalendarSession({ weekStartsOn });
  const geometry = useMonthSheetGeometry({
    openProgress: session.openProgress,
    setSnapHeight: session.setSnapHeight,
    visibleMonth: session.visibleMonth,
    weekStartsOn,
    selectedDayKey: session.selectedDayKey,
  });

  return (
    <SheetOpenProgressContext.Provider value={session.openProgress}>
      <View className="w-full flex-1 self-stretch">
        {/* Clip the closed sheet so its chrome can't paint under Quick Add / tabs. */}
        <View
          className="w-full flex-1 overflow-hidden"
          onLayout={geometry.onHostLayout}
        >
          <View onLayout={geometry.onChromeLayout}>
            <MonthCalendarHeader yearMonth={session.headerMonth} />
            <WeekdayHeader weekStartsOn={weekStartsOn} />
          </View>

          <View
            className="flex-1 overflow-hidden"
            onLayout={geometry.onPagerSlotLayout}
          >
            <GestureDetector gesture={session.openSwipeGesture}>
              <Animated.View style={geometry.weekClipStyle}>
                <Animated.View
                  animatedProps={geometry.monthTouchProps}
                  style={[
                    geometry.weekPinStyle,
                    geometry.monthPagerVisibilityStyle,
                  ]}
                >
                  <MonthPager
                    ref={session.pagerRef}
                    months={session.months}
                    initialIndex={session.initialIndex}
                    pageIndex={session.pageIndex}
                    weekStartsOn={weekStartsOn}
                    appointmentsCache={session.monthPagerCache}
                    eventIndicators={session.monthEventIndicators}
                    scrollEnabled={!session.sheetOpen}
                    onDayPress={session.handleDayPress}
                    pageScrollHandler={session.pageScrollHandler}
                    onPageSelected={session.onPageSelected}
                    onPageScrollStateChanged={session.onPageScrollStateChanged}
                  />
                </Animated.View>

                <Animated.View
                  collapsable={false}
                  animatedProps={geometry.weekTouchProps}
                  style={[
                    geometry.weekOverlayStyle,
                    { backgroundColor: native.surface.default },
                    geometry.weekPagerVisibilityStyle,
                  ]}
                >
                  <WeekPager
                    ref={session.weekPagerRef}
                    weeks={session.weeks}
                    initialIndex={session.weekInitialIndex}
                    pageIndex={session.weekPageIndex}
                    appointmentsCache={session.cache}
                    eventIndicators="dots"
                    scrollEnabled={session.sheetOpen}
                    onDayPress={session.handleWeekDayPress}
                    onPageSelected={session.handleWeekPageSelected}
                    onPageScrollStateChanged={
                      session.onWeekPageScrollStateChanged
                    }
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>

            <DayEventsSheet
              dayKey={session.selectedDayKey}
              events={session.events}
              snapHeight={geometry.sheetSnapHeight}
              sheetAnimatedStyle={session.sheetAnimatedStyle}
              sheetAnimatedProps={session.sheetAnimatedProps}
              beginDrag={session.beginDrag}
              applyDragTranslation={session.applyDragTranslation}
              endDrag={session.endDrag}
              open={session.openSheet}
              close={session.closeSheet}
            />
          </View>
        </View>

        <MonthQuickAddField
          dayKey={session.selectedDayKey}
          events={session.events}
        />
      </View>
    </SheetOpenProgressContext.Provider>
  );
}
