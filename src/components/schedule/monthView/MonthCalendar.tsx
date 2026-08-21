import React, { useEffect } from "react";
import { View } from "react-native";

import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useThemeTokens } from "@/theme";
import { toYearMonth, type WeekdayIndex } from "@/utils/calendar";

import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Full-screen month calendar with horizontal paging.
 * Appointments paint from the WatermelonDB month cache into each day cell.
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

  useEffect(() => {
    ensureVisibleWindow(visibleMonth);
  }, [ensureVisibleWindow, visibleMonth]);

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
  );
}
