import { memo } from "react";

import { ScheduleCalendarHeader } from "@/components/schedule/ScheduleCalendarHeader";
import { formatYearMonthShort, type YearMonth } from "@/helpers/schedule/calendar";

export type MonthCalendarHeaderProps = {
  yearMonth: YearMonth;
};

function MonthCalendarHeaderComponent({
  yearMonth,
}: MonthCalendarHeaderProps) {
  return <ScheduleCalendarHeader title={formatYearMonthShort(yearMonth)} />;
}

function monthCalendarHeaderEqual(
  prev: MonthCalendarHeaderProps,
  next: MonthCalendarHeaderProps,
): boolean {
  return (
    prev.yearMonth.year === next.yearMonth.year &&
    prev.yearMonth.month === next.yearMonth.month
  );
}

export const MonthCalendarHeader = memo(
  MonthCalendarHeaderComponent,
  monthCalendarHeaderEqual,
);
