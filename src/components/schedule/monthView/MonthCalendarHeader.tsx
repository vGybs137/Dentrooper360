import { memo } from "react";

import { ScheduleCalendarHeader } from "@/components/schedule/ScheduleCalendarHeader";
import { formatYearMonthShort, type YearMonth } from "@/utils/calendar";

export type MonthCalendarHeaderProps = {
  yearMonth: YearMonth;
};

function MonthCalendarHeaderComponent({
  yearMonth,
}: MonthCalendarHeaderProps) {
  return <ScheduleCalendarHeader title={formatYearMonthShort(yearMonth)} />;
}

export const MonthCalendarHeader = memo(MonthCalendarHeaderComponent);
