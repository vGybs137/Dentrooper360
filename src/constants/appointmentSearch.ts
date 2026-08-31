import {
  addDays,
  toCalendarDate,
  toLocalDate,
  type CalendarDate,
} from "@/utils/calendar";

export type AppointmentSearchTimeWindow =
  | "all"
  | "past_week"
  | "next_week"
  | "past_3_months"
  | "next_3_months";

export type AppointmentSearchTimeWindowOption = {
  id: Exclude<AppointmentSearchTimeWindow, "all">;
  label: string;
};

/** Selectable time pills — `all` is the unset default, not listed. */
export const APPOINTMENT_SEARCH_TIME_WINDOWS: readonly AppointmentSearchTimeWindowOption[] =
  [
    { id: "past_week", label: "Past week" },
    { id: "next_week", label: "Next week" },
    { id: "past_3_months", label: "Past 3 months" },
    { id: "next_3_months", label: "Next 3 months" },
  ] as const;

export const DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW: AppointmentSearchTimeWindow =
  "all";

export type AppointmentSearchTimeRange = {
  startMs: number;
  endMs: number;
};

function addCalendarMonths(date: CalendarDate, delta: number): CalendarDate {
  const next = toLocalDate(date);
  next.setMonth(next.getMonth() + delta);
  return toCalendarDate(next);
}

function dayStartMs(date: CalendarDate): number {
  return toLocalDate(date).getTime();
}

/**
 * Resolve a search window to local-day `[startMs, endMs)`.
 * `all` (no time filter selected) → `null` (no SQL bounds).
 */
export function resolveAppointmentSearchTimeRange(
  window: AppointmentSearchTimeWindow,
  now: Date = new Date(),
): AppointmentSearchTimeRange | null {
  if (window === "all") {
    return null;
  }

  const today = toCalendarDate(now);
  const todayStart = dayStartMs(today);
  const tomorrowStart = dayStartMs(addDays(today, 1));

  switch (window) {
    case "past_week":
      return {
        startMs: dayStartMs(addDays(today, -7)),
        endMs: tomorrowStart,
      };
    case "next_week":
      return {
        startMs: todayStart,
        endMs: dayStartMs(addDays(today, 7)),
      };
    case "past_3_months":
      return {
        startMs: dayStartMs(addCalendarMonths(today, -3)),
        endMs: tomorrowStart,
      };
    case "next_3_months":
      return {
        startMs: todayStart,
        endMs: dayStartMs(addCalendarMonths(today, 3)),
      };
    default: {
      const _exhaustive: never = window;
      return _exhaustive;
    }
  }
}

export function appointmentSearchTimeWindowLabel(
  window: AppointmentSearchTimeWindow,
): string {
  if (window === "all") {
    return "All time";
  }
  return (
    APPOINTMENT_SEARCH_TIME_WINDOWS.find((option) => option.id === window)
      ?.label ?? "All time"
  );
}
