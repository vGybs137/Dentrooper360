import {
  addDays,
  daysInMonth,
  sameDay,
  startOfMonth,
  toDayKey,
  toMonthKey,
  todayCalendarDate,
  weekdayOffset,
} from "./dateKeys";
import type {
  DayCellModel,
  MonthGrid,
  WeekdayIndex,
  YearMonth,
} from "./types";

export const MONTH_GRID_ROWS = 6;
export const MONTH_GRID_COLS = 7;
export const MONTH_GRID_CELL_COUNT = MONTH_GRID_ROWS * MONTH_GRID_COLS;

export type BuildMonthGridOptions = {
  /** 0 = Sunday (default), 1 = Monday, … */
  weekStartsOn?: WeekdayIndex;
  /** Override “today” for tests / screenshots. */
  today?: ReturnType<typeof todayCalendarDate>;
};

/**
 * Builds a fixed 6×7 month grid including leading/trailing out-of-month days.
 */
export function buildMonthGrid(
  yearMonth: YearMonth,
  options: BuildMonthGridOptions = {},
): MonthGrid {
  const weekStartsOn = options.weekStartsOn ?? 0;
  const today = options.today ?? todayCalendarDate();
  const first = startOfMonth(yearMonth);
  const leading = weekdayOffset(first, weekStartsOn);
  const gridStart = addDays(first, -leading);

  const cells: DayCellModel[] = [];
  for (let i = 0; i < MONTH_GRID_CELL_COUNT; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      dayKey: toDayKey(date),
      inCurrentMonth:
        date.year === yearMonth.year && date.month === yearMonth.month,
      isToday: sameDay(date, today),
    });
  }

  return {
    yearMonth,
    monthKey: toMonthKey(yearMonth),
    cells,
  };
}

/** Convenience: assert grid invariants (useful in tests / debug). */
export function assertMonthGridInvariants(grid: MonthGrid): void {
  if (grid.cells.length !== MONTH_GRID_CELL_COUNT) {
    throw new Error(
      `Month grid must have ${MONTH_GRID_CELL_COUNT} cells, got ${grid.cells.length}`,
    );
  }

  const inMonth = grid.cells.filter((c) => c.inCurrentMonth);
  const expected = daysInMonth(grid.yearMonth);
  if (inMonth.length !== expected) {
    throw new Error(
      `Expected ${expected} in-month cells for ${grid.monthKey}, got ${inMonth.length}`,
    );
  }

  const firstInMonth = inMonth[0];
  if (!firstInMonth || firstInMonth.date.day !== 1) {
    throw new Error(`First in-month cell must be day 1 for ${grid.monthKey}`);
  }
}
