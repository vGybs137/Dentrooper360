import React, { useState } from "react";
import { View } from "react-native";

import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import {
  toDayKey,
  todayCalendarDate,
  toYearMonth,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Full-screen month calendar with horizontal paging.
 * Header label is derived from the settled pager page only (no I/O).
 */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const centerMonth = toYearMonth(new Date());
  const { months, initialIndex, pageIndex, visibleMonth, onPageSelected } =
    useVisibleMonth(centerMonth);
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>(() =>
    toDayKey(todayCalendarDate()),
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
      <MonthPager
        months={months}
        initialIndex={initialIndex}
        pageIndex={pageIndex}
        weekStartsOn={weekStartsOn}
        selectedDayKey={selectedDayKey}
        onDayPress={setSelectedDayKey}
        onPageSelected={onPageSelected}
      />
    </View>
  );
}
