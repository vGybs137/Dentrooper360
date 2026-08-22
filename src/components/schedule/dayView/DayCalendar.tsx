import { useCallback, useEffect } from "react";
import { View } from "react-native";

import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { useWeekAppointmentsCache } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useVisibleDay } from "@/hooks/schedule/useVisibleDay";
import { selectCalendarDay, useCalendarSelectionStore } from "@/stores/calendarSelectionStore";
import { weekStartDayKey, type WeekdayIndex } from "@/utils/calendar";

import { DayCalendarHeader } from "./DayCalendarHeader";
import { DayCalendarPager } from "./DayCalendarPager";

export type DayCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Day view shell — header and horizontally paged timed grids. */
export function DayCalendar({ weekStartsOn = 0 }: DayCalendarProps) {
  const selectedDayKey = useCalendarSelectionStore((state) => state.selectedDayKey);
  const {
    days,
    initialIndex,
    pageIndex,
    visibleDayKey,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleDay(selectedDayKey);

  const { ensureVisibleWindow, getEventsForDay } = useWeekAppointmentsCache({
    isDragging,
  });

  useEffect(() => {
    ensureVisibleWindow(weekStartDayKey(visibleDayKey, weekStartsOn));
  }, [ensureVisibleWindow, visibleDayKey, weekStartsOn]);

  const handlePageSelected = useCallback<
    NonNullable<React.ComponentProps<typeof DayCalendarPager>["onPageSelected"]>
  >(
    (event) => {
      onPageSelected(event);
      const nextDayKey = days[event.nativeEvent.position];
      if (nextDayKey) {
        selectCalendarDay(nextDayKey);
      }
    },
    [days, onPageSelected],
  );

  return (
    <View className="w-full flex-1 self-stretch">
      <DayCalendarHeader dayKey={visibleDayKey} />
      <DayCalendarPager
        days={days}
        initialIndex={initialIndex}
        pageIndex={pageIndex}
        gutterWidth={WEEK_VIEW_GUTTER_WIDTH}
        getEventsForDay={getEventsForDay}
        onPageSelected={handlePageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      />
    </View>
  );
}
