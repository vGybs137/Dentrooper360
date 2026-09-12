import dayjs from "dayjs";

import {
  addDays,
  parseDayKey,
  toCalendarDate,
  toLocalDate,
  type CalendarDate,
  type DayKey,
} from "@/helpers/schedule/calendar";
import { t } from "@/i18n";

export type AppointmentSearchTimeWindow =
  | "all"
  | "past_week"
  | "next_week"
  | "past_3_months"
  | "next_3_months"
  | "custom";

export type AppointmentSearchTimeWindowOption = {
  id: Exclude<AppointmentSearchTimeWindow, "all">;
  labelKey: string;
};

/** Inclusive local-day range for the Custom time window. */
export type AppointmentSearchCustomRange = {
  startDayKey: DayKey;
  endDayKey: DayKey;
};

/** Selectable time pills — `all` is the unset default, not listed. */
export const APPOINTMENT_SEARCH_TIME_WINDOWS: readonly AppointmentSearchTimeWindowOption[] =
  [
    { id: "past_week", labelKey: "schedule:search.time.pastWeek" },
    { id: "next_week", labelKey: "schedule:search.time.nextWeek" },
    { id: "past_3_months", labelKey: "schedule:search.time.past3Months" },
    { id: "next_3_months", labelKey: "schedule:search.time.next3Months" },
    { id: "custom", labelKey: "schedule:search.time.custom" },
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
    return t("schedule:search.time.all");
  }

  if (window === "custom") {
    if (!customRange) {
      return t("schedule:search.time.custom");
    }

    const normalized = normalizeCustomRange(customRange);
    if (normalized.startDayKey === normalized.endDayKey) {
      return formatCustomDayLabel(normalized.startDayKey);
    }

    return `${formatCustomDayLabel(normalized.startDayKey)}–${formatCustomDayLabel(normalized.endDayKey)}`;
  }

  const option = APPOINTMENT_SEARCH_TIME_WINDOWS.find(
    (entry) => entry.id === window,
  );
  return option ? t(option.labelKey) : t("schedule:search.time.all");
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
