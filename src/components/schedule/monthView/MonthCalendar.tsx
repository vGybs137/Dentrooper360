import React, { useMemo, useState } from "react";
import { View } from "react-native";

import { useThemeTokens } from "@/theme";
import {
  toDayKey,
  todayCalendarDate,
  toYearMonth,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthGrid } from "./MonthGrid";
import type { MonthDayEventPreview } from "./types";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
  /** Optional day → events map. Later steps feed WatermelonDB here. */
  eventsByDay?: Record<DayKey, MonthDayEventPreview[]>;
};

/**
 * Full-screen month grid. Step 2 chrome; events come from props (demo or DB).
 */
export function MonthCalendar({
  weekStartsOn = 0,
  eventsByDay,
}: MonthCalendarProps) {
  const theme = useThemeTokens();
  const yearMonth = toYearMonth(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>(() =>
    toDayKey(todayCalendarDate()),
  );

  // Temporary placeholders so cells show event layout before WatermelonDB (Step 6).
  const resolvedEvents = useMemo(() => {
    if (eventsByDay) return eventsByDay;
    return buildDemoEvents(yearMonth, theme.palette.brand.default, theme.palette.accent.default);
  }, [eventsByDay, theme.palette.accent.default, theme.palette.brand.default, yearMonth]);

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
      }}
    >
      <MonthCalendarHeader yearMonth={yearMonth} />
      <WeekdayHeader weekStartsOn={weekStartsOn} />
      <MonthGrid
        yearMonth={yearMonth}
        weekStartsOn={weekStartsOn}
        selectedDayKey={selectedDayKey}
        eventsByDay={resolvedEvents}
        onDayPress={setSelectedDayKey}
      />
    </View>
  );
}

function buildDemoEvents(
  yearMonth: ReturnType<typeof toYearMonth>,
  brand: string,
  accent: string,
): Record<DayKey, MonthDayEventPreview[]> {
  const y = yearMonth.year;
  const m = String(yearMonth.month + 1).padStart(2, "0");
  const key = (day: number) =>
    `${y}-${m}-${String(day).padStart(2, "0")}` as DayKey;

  return {
    [key(3)]: [
      { id: "d1", title: "Hygiene", color: brand },
      { id: "d2", title: "Consult", color: accent },
    ],
    [key(12)]: [{ id: "d3", title: "Root canal", color: brand }],
    [key(18)]: [
      { id: "d4", title: "Cleaning", color: brand },
      { id: "d5", title: "Follow-up", color: accent },
      { id: "d6", title: "X-ray", color: brand },
      { id: "d7", title: "Review", color: accent },
    ],
    [key(21)]: [{ id: "d8", title: "New patient", color: brand }],
    [key(27)]: [
      { id: "d9", title: "Whitening", color: accent },
      { id: "d10", title: "Check-up", color: brand },
    ],
  };
}
