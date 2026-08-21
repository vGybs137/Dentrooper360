import {
  addDays,
  addWeeks,
  parseDayKey,
  sameDay,
  toDayKey,
  todayCalendarDate,
} from "./dateKeys";
import type { DayCellModel, DayKey, YearMonth } from "./types";

export const WEEK_DAYS = 7;

export type BuildWeekCellsOptions = {
  /** Override “today” for tests / screenshots. */
  today?: ReturnType<typeof todayCalendarDate>;
};

/**
 * Builds 7 day cells for an absolute calendar week starting at `weekStartKey`.
 * `focusMonth` drives muted (out-of-month) styling across month boundaries.
 */
export function buildWeekCells(
  weekStartKey: DayKey,
  focusMonth: YearMonth,
  options: BuildWeekCellsOptions = {},
): DayCellModel[] {
  const today = options.today ?? todayCalendarDate();
  const start = parseDayKey(weekStartKey);
  const cells: DayCellModel[] = [];

  for (let i = 0; i < WEEK_DAYS; i++) {
    const date = addDays(start, i);
    cells.push({
      date,
      dayKey: toDayKey(date),
      inCurrentMonth:
        date.year === focusMonth.year && date.month === focusMonth.month,
      isToday: sameDay(date, today),
    });
  }

  return cells;
}

/** Primary month for muted styling: mid-week day (stable for the week page). */
export function focusMonthForWeek(weekStartKey: DayKey): YearMonth {
  const mid = addDays(parseDayKey(weekStartKey), 3);
  return { year: mid.year, month: mid.month };
}

/** Weeks before/after the center week in the pager window. */
export const WEEK_PAGER_RADIUS = 120;

export function buildWeekWindow(
  centerWeekStart: DayKey,
  radius: number = WEEK_PAGER_RADIUS,
): DayKey[] {
  const weeks: DayKey[] = [];
  for (let offset = -radius; offset <= radius; offset++) {
    weeks.push(addWeeks(centerWeekStart, offset));
  }
  return weeks;
}
