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
 * Full-screen month calendar with horizontal paging (Step 3).
 * Header still shows the session center month; Step 4 syncs it to the pager.
 */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const centerMonth = toYearMonth(new Date());
  const { months, initialIndex, pageIndex, onPageSelected } =
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
      <MonthCalendarHeader yearMonth={centerMonth} />
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
