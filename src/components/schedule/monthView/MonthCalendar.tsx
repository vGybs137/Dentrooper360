import React from "react";
import { View } from "react-native";

import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { toYearMonth, type WeekdayIndex } from "@/utils/calendar";

import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Full-screen month calendar with horizontal paging.
 * Header follows the settled page; day selection lives in Zustand
 * so only the previous/next DayCell re-render on tap.
 */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const centerMonth = toYearMonth(new Date());
  const { months, initialIndex, pageIndex, visibleMonth, onPageSelected } =
    useVisibleMonth(centerMonth);

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
        onPageSelected={onPageSelected}
      />
    </View>
  );
}
