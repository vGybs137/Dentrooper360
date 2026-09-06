import { useCallback, useEffect, useMemo } from "react";
import { View, type NativeSyntheticEvent } from "react-native";
import type { PagerViewOnPageSelectedEventData } from "react-native-pager-view";

import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { useWeekAppointmentsCache } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useVisibleDay } from "@/hooks/schedule/useVisibleDay";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
} from "@/stores/calendarSelectionStore";
import {
  coerceDayViewDayKey,
  weekStartDayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { DayCalendarHeader } from "./DayCalendarHeader";
import { DayCalendarPager } from "./DayCalendarPager";

export type DayCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Day view shell — header and horizontally paged timed grids (Sundays skipped). */
export function DayCalendar({ weekStartsOn = 0 }: DayCalendarProps) {
  const selectedDayKey = useCalendarSelectionStore(
    (state) => state.selectedDayKey,
  );
  const dayViewDayKey = useMemo(
    () => coerceDayViewDayKey(selectedDayKey),
    [selectedDayKey],
  );

  useEffect(() => {
    if (selectedDayKey !== dayViewDayKey) {
      selectCalendarDay(dayViewDayKey);
    }
  }, [dayViewDayKey, selectedDayKey]);

  const {
    days,
    initialIndex,
    pageIndex,
    visibleDayKey,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleDay(dayViewDayKey);

  const { ensureVisibleWindow, getEventsForDay } = useWeekAppointmentsCache({
    isDragging,
  });

  useEffect(() => {
    ensureVisibleWindow(weekStartDayKey(visibleDayKey, weekStartsOn));
  }, [ensureVisibleWindow, visibleDayKey, weekStartsOn]);

  const handlePageSelected = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      onPageSelected(event);
      const nextDayKey = days[event.nativeEvent.position];
      if (nextDayKey) {
        selectCalendarDay(coerceDayViewDayKey(nextDayKey));
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
