import type {
  MonthAppointmentsCache,
  MonthEventsByDay,
} from "@/hooks/schedule/useMonthAppointmentsCache";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { DayKey, MonthKey } from "@/utils/calendar";

export const EMPTY_DAY_EVENTS: MonthDayEventPreview[] = [];

/** Stable empty month map so unloaded months don't break memoization. */
export const EMPTY_MONTH_EVENTS: MonthEventsByDay = {};

export function monthEventsSlice(
  cache: MonthAppointmentsCache,
  monthKey: MonthKey,
): MonthEventsByDay {
  return cache[monthKey] ?? EMPTY_MONTH_EVENTS;
}

export function eventsForDay(
  eventsByDay: MonthEventsByDay | undefined,
  dayKey: DayKey,
): MonthDayEventPreview[] {
  return eventsByDay?.[dayKey] ?? EMPTY_DAY_EVENTS;
}

/**
 * Resolve events for a day using the page's month map plus prev/next neighbors
 * (leading/trailing out-of-month cells).
 */
export function eventsForDayWithNeighbors(
  dayKey: DayKey,
  monthKey: MonthKey,
  eventsByDay: MonthEventsByDay | undefined,
  prevMonthKey: MonthKey,
  prevMonthEventsByDay: MonthEventsByDay | undefined,
  nextMonthKey: MonthKey,
  nextMonthEventsByDay: MonthEventsByDay | undefined,
): MonthDayEventPreview[] {
  const dayMonthKey = dayKey.slice(0, 7) as MonthKey;
  if (dayMonthKey === monthKey) {
    return eventsForDay(eventsByDay, dayKey);
  }
  if (dayMonthKey === prevMonthKey) {
    return eventsForDay(prevMonthEventsByDay, dayKey);
  }
  if (dayMonthKey === nextMonthKey) {
    return eventsForDay(nextMonthEventsByDay, dayKey);
  }
  return EMPTY_DAY_EVENTS;
}
