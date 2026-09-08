import { memo, useMemo } from "react";

import { ScheduleCalendarHeader } from "@/components/schedule/ScheduleCalendarHeader";
import {
  formatWeekHeaderMonthLabel,
  type DayKey,
} from "@/helpers/schedule/calendar";

export type WeekCalendarHeaderProps = {
  weekStartKey: DayKey;
  weekEndKey: DayKey;
};

function WeekCalendarHeaderComponent({
  weekStartKey,
  weekEndKey,
}: WeekCalendarHeaderProps) {
  const label = useMemo(
    () => formatWeekHeaderMonthLabel(weekStartKey, weekEndKey),
    [weekEndKey, weekStartKey],
  );

  return <ScheduleCalendarHeader title={label} />;
}

export const WeekCalendarHeader = memo(WeekCalendarHeaderComponent);
