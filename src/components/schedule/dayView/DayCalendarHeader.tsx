import { memo, useMemo } from "react";

import { ScheduleCalendarHeader } from "@/components/schedule/ScheduleCalendarHeader";
import { formatDayKeyMonthShort, type DayKey } from "@/helpers/schedule/calendar";

export type DayCalendarHeaderProps = {
  dayKey: DayKey;
};

function DayCalendarHeaderComponent({ dayKey }: DayCalendarHeaderProps) {
  const label = useMemo(() => formatDayKeyMonthShort(dayKey), [dayKey]);

  return <ScheduleCalendarHeader title={label} />;
}

export const DayCalendarHeader = memo(DayCalendarHeaderComponent);
