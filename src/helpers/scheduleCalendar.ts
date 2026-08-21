import {
  buildMonthGrid,
  MONTH_GRID_COLS,
  parseDayKey,
  type DayKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

/** Week row index (0–5) of `dayKey` within a month grid. */
export function weekRowForDay(
  yearMonth: YearMonth,
  weekStartsOn: WeekdayIndex,
  dayKey: DayKey,
): number {
  const grid = buildMonthGrid(yearMonth, { weekStartsOn });
  const index = grid.cells.findIndex((cell) => cell.dayKey === dayKey);
  if (index < 0) return 0;
  return Math.floor(index / MONTH_GRID_COLS);
}

/** YearMonth for the calendar day identified by `dayKey`. */
export function yearMonthFromDayKey(dayKey: DayKey): YearMonth {
  const date = parseDayKey(dayKey);
  return { year: date.year, month: date.month };
}
