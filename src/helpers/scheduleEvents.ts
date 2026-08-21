import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { DayKey, MonthKey } from "@/utils/calendar";

const EMPTY_DAY_EVENTS: MonthDayEventPreview[] = [];

export function eventsForDay(
  cache: MonthAppointmentsCache,
  dayKey: DayKey,
): MonthDayEventPreview[] {
  const monthKey = dayKey.slice(0, 7) as MonthKey;
  return cache[monthKey]?.[dayKey] ?? EMPTY_DAY_EVENTS;
}
