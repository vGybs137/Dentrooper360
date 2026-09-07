import dayjs from "dayjs";

import {
  addDays,
  parseDayKey,
  toCalendarDate,
  toLocalDate,
  type CalendarDate,
  type DayKey,
} from "@/utils/calendar";

export type AppointmentSearchTimeWindow =
  | "all"
  | "past_week"
  | "next_week"
  | "past_3_months"
  | "next_3_months"
  | "custom";

export type AppointmentSearchTimeWindowOption = {
  id: Exclude<AppointmentSearchTimeWindow, "all">;
  label: string;
};

/** Inclusive local-day range for the Custom time window. */
export type AppointmentSearchCustomRange = {
  startDayKey: DayKey;
  endDayKey: DayKey;
};

/** Selectable time pills — `all` is the unset default, not listed. */
export const APPOINTMENT_SEARCH_TIME_WINDOWS: readonly AppointmentSearchTimeWindowOption[] =
  [
    { id: "past_week", label: "Past week" },
    { id: "next_week", label: "Next week" },
    { id: "past_3_months", label: "Past 3 months" },
    { id: "next_3_months", label: "Next 3 months" },
    { id: "custom", label: "Custom" },
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

function normalizeCustomRange(
  range: AppointmentSearchCustomRange,
): AppointmentSearchCustomRange {
  if (range.startDayKey <= range.endDayKey) {
    return range;
  }

  return {
    startDayKey: range.endDayKey,
    endDayKey: range.startDayKey,
  };
}

/**
 * Resolve a search window to local-day `[startMs, endMs)`.
 * `all` (no time filter selected) → `null` (no SQL bounds).
 * `custom` without a range → `null`.
 */
export function resolveAppointmentSearchTimeRange(
  window: AppointmentSearchTimeWindow,
  now: Date = new Date(),
  customRange: AppointmentSearchCustomRange | null = null,
): AppointmentSearchTimeRange | null {
  if (window === "all") {
    return null;
  }

  if (window === "custom") {
    if (!customRange) {
      return null;
    }

    const normalized = normalizeCustomRange(customRange);
    const start = parseDayKey(normalized.startDayKey);
    const endExclusive = addDays(parseDayKey(normalized.endDayKey), 1);
    return {
      startMs: dayStartMs(start),
      endMs: dayStartMs(endExclusive),
    };
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

function formatCustomDayLabel(dayKey: DayKey): string {
  return dayjs(toLocalDate(parseDayKey(dayKey))).format("D MMM");
}

export function appointmentSearchTimeWindowLabel(
  window: AppointmentSearchTimeWindow,
  customRange: AppointmentSearchCustomRange | null = null,
): string {
  if (window === "all") {
    return "All time";
  }

  if (window === "custom") {
    if (!customRange) {
      return "Custom";
    }

    const normalized = normalizeCustomRange(customRange);
    if (normalized.startDayKey === normalized.endDayKey) {
      return formatCustomDayLabel(normalized.startDayKey);
    }

    return `${formatCustomDayLabel(normalized.startDayKey)}–${formatCustomDayLabel(normalized.endDayKey)}`;
  }

  return (
    APPOINTMENT_SEARCH_TIME_WINDOWS.find((option) => option.id === window)
      ?.label ?? "All time"
  );
}

/**
 * Two-tap custom range selection.
 * - 1st tap → pending start (filter not applied yet)
 * - 2nd tap same day → single-day range complete
 * - 2nd tap other day → multi-day range complete
 */
export function applyCustomRangeDayPress(
  pendingStartDayKey: DayKey | null,
  dayKey: DayKey,
): {
  pendingStartDayKey: DayKey | null;
  range: AppointmentSearchCustomRange | null;
  completed: boolean;
} {
  if (pendingStartDayKey == null) {
    return {
      pendingStartDayKey: dayKey,
      range: null,
      completed: false,
    };
  }

  if (pendingStartDayKey === dayKey) {
    return {
      pendingStartDayKey: null,
      range: { startDayKey: dayKey, endDayKey: dayKey },
      completed: true,
    };
  }

  return {
    pendingStartDayKey: null,
    range: normalizeCustomRange({
      startDayKey: pendingStartDayKey,
      endDayKey: dayKey,
    }),
    completed: true,
  };
}
