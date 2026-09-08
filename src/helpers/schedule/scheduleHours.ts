import {
  WEEK_VIEW_DEFAULT_END_HOUR,
  WEEK_VIEW_DEFAULT_START_HOUR,
} from "@/constants/schedule";
import {
  parseDayKey,
  weekdayIndex,
  type DayKey,
  type WeekdayIndex,
} from "@/helpers/schedule/calendar";

/**
 * Parses a schedule hour string from the API (e.g. "8:00", "08:00:00") to 0–23.
 */
export function parseScheduleHour(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value?.trim()) return fallback;

  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) return fallback;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return fallback;

  return hour;
}

export type ScheduleHourRange = {
  startHour: number;
  endHour: number;
};

export function normalizeScheduleHourRange(
  startHour: number,
  endHour: number,
): ScheduleHourRange {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  return { startHour: start, endHour: end };
}

export const DEFAULT_SCHEDULE_HOUR_RANGE = normalizeScheduleHourRange(
  WEEK_VIEW_DEFAULT_START_HOUR,
  WEEK_VIEW_DEFAULT_END_HOUR,
);

/** `day_of_week` matches `Date#getDay` / `WeekdayIndex` (0 = Sunday … 6 = Saturday). */
export function normalizeProviderWeekday(dayOfWeek: number): WeekdayIndex | null {
  if (!Number.isFinite(dayOfWeek)) {
    return null;
  }

  const weekday = Math.trunc(dayOfWeek);
  if (weekday < 0 || weekday > 6) {
    return null;
  }

  return weekday as WeekdayIndex;
}

export type ProviderWorkingHoursRow = {
  dayOfWeek: number;
  startHour: string;
  endHour: string;
};

/**
 * Builds per-weekday hour ranges from synced rows.
 * Multiple rows for the same weekday collapse to earliest start / latest end.
 */
export function buildHoursByWeekday(
  rows: readonly ProviderWorkingHoursRow[],
): Partial<Record<WeekdayIndex, ScheduleHourRange>> {
  const buckets = new Map<
    WeekdayIndex,
    { startHour: number; endHour: number }
  >();

  for (const row of rows) {
    const weekday = normalizeProviderWeekday(row.dayOfWeek);
    if (weekday == null) {
      continue;
    }

    const startHour = parseScheduleHour(
      row.startHour,
      WEEK_VIEW_DEFAULT_START_HOUR,
    );
    const endHour = parseScheduleHour(
      row.endHour,
      WEEK_VIEW_DEFAULT_END_HOUR,
    );
    const existing = buckets.get(weekday);
    if (!existing) {
      buckets.set(weekday, { startHour, endHour });
      continue;
    }

    existing.startHour = Math.min(existing.startHour, startHour);
    existing.endHour = Math.max(existing.endHour, endHour);
  }

  const result: Partial<Record<WeekdayIndex, ScheduleHourRange>> = {};
  for (const [weekday, range] of buckets) {
    result[weekday] = normalizeScheduleHourRange(
      range.startHour,
      range.endHour,
    );
  }
  return result;
}

/** Union of all configured weekday windows; defaults when none are configured. */
export function scheduleHoursEnvelope(
  hoursByWeekday: Partial<Record<WeekdayIndex, ScheduleHourRange>>,
): ScheduleHourRange {
  const ranges = Object.values(hoursByWeekday).filter(
    (range): range is ScheduleHourRange => range != null,
  );

  if (ranges.length === 0) {
    return DEFAULT_SCHEDULE_HOUR_RANGE;
  }

  let startHour = Number.POSITIVE_INFINITY;
  let endHour = Number.NEGATIVE_INFINITY;
  for (const range of ranges) {
    startHour = Math.min(startHour, range.startHour);
    endHour = Math.max(endHour, range.endHour);
  }

  return normalizeScheduleHourRange(startHour, endHour);
}

/**
 * Hours for a calendar day.
 * - No configured rows at all → defaults for every day
 * - Some rows configured → only weekdays present in the map (others closed / null)
 */
export function hoursForWeekday(
  hoursByWeekday: Partial<Record<WeekdayIndex, ScheduleHourRange>>,
  weekday: WeekdayIndex,
  hasConfiguredHours: boolean,
): ScheduleHourRange | null {
  if (!hasConfiguredHours) {
    return DEFAULT_SCHEDULE_HOUR_RANGE;
  }

  return hoursByWeekday[weekday] ?? null;
}

export function hoursForDayKey(
  hoursByWeekday: Partial<Record<WeekdayIndex, ScheduleHourRange>>,
  dayKey: DayKey,
  hasConfiguredHours: boolean,
): ScheduleHourRange | null {
  return hoursForWeekday(
    hoursByWeekday,
    weekdayIndex(parseDayKey(dayKey)),
    hasConfiguredHours,
  );
}

/** Weekday indexes (0 = Sunday) with no working hours when hours are configured. */
export function closedWeekdayIndexes(
  hoursByWeekday: Partial<Record<WeekdayIndex, ScheduleHourRange>>,
  hasConfiguredHours: boolean,
): WeekdayIndex[] {
  if (!hasConfiguredHours) {
    return [];
  }

  const closed: WeekdayIndex[] = [];
  for (let day = 0; day <= 6; day += 1) {
    const weekday = day as WeekdayIndex;
    if (hoursForWeekday(hoursByWeekday, weekday, true) == null) {
      closed.push(weekday);
    }
  }
  return closed;
}
