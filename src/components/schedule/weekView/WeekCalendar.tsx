import { useEffect, useMemo } from "react";
import { View } from "react-native";

import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { useWeekAppointmentsCache } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useVisibleWeek } from "@/hooks/schedule/useVisibleWeek";
import {
  addDays,
  parseDayKey,
  toDayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { WeekCalendarHeader } from "./WeekCalendarHeader";
import { WeekCalendarPager } from "./WeekCalendarPager";

export type WeekCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Week view shell — header, day row, and horizontally paged timed grids. */
export function WeekCalendar({ weekStartsOn = 0 }: WeekCalendarProps) {
  const {
    weeks,
    initialIndex,
    pageIndex,
    visibleWeekStart,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleWeek(weekStartsOn);

  const { ensureVisibleWindow, getEventsForWeek } = useWeekAppointmentsCache({
    isDragging,
  });

  useEffect(() => {
    ensureVisibleWindow(visibleWeekStart);
  }, [ensureVisibleWindow, visibleWeekStart]);

  const weekEndKey = useMemo(
    () => toDayKey(addDays(parseDayKey(visibleWeekStart), 6)),
    [visibleWeekStart],
  );

  return (
    <View className="w-full flex-1 self-stretch">
      <WeekCalendarHeader
        weekStartKey={visibleWeekStart}
        weekEndKey={weekEndKey}
      />
      <WeekCalendarPager
        weeks={weeks}
        initialIndex={initialIndex}
        pageIndex={pageIndex}
        weekStartsOn={weekStartsOn}
        gutterWidth={WEEK_VIEW_GUTTER_WIDTH}
        getEventsForWeek={getEventsForWeek}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      />
    </View>
  );
}
