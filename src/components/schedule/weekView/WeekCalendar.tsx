import { useMemo } from "react";
import { View } from "react-native";

import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import {
  addDays,
  parseDayKey,
  toDayKey,
  todayCalendarDate,
  weekStartDayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { WeekCalendarHeader } from "./WeekCalendarHeader";
import { WeekDayHeaderRow } from "./WeekDayHeaderRow";
import { WeekTimeGrid } from "./WeekTimeGrid";

export type WeekCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Week view shell — header, day row, and scrollable timed grid (no events yet). */
export function WeekCalendar({ weekStartsOn = 0 }: WeekCalendarProps) {
  const weekStartKey = useMemo(
    () => weekStartDayKey(toDayKey(todayCalendarDate()), weekStartsOn),
    [weekStartsOn],
  );
  const weekEndKey = useMemo(
    () => toDayKey(addDays(parseDayKey(weekStartKey), 6)),
    [weekStartKey],
  );

  return (
    <View className="w-full flex-1 self-stretch">
      <WeekCalendarHeader
        weekStartKey={weekStartKey}
        weekEndKey={weekEndKey}
      />
      <WeekDayHeaderRow
        weekStartKey={weekStartKey}
        weekStartsOn={weekStartsOn}
        gutterWidth={WEEK_VIEW_GUTTER_WIDTH}
      />
      <WeekTimeGrid gutterWidth={WEEK_VIEW_GUTTER_WIDTH} />
    </View>
  );
}
