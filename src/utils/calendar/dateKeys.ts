import type {
  CalendarDate,
  DayKey,
  MonthKey,
  WeekdayIndex,
  YearMonth,
} from "./types";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar parts from a Date (ignores time-of-day for identity). */
export function toCalendarDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

export function toYearMonth(date: Date): YearMonth {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
}

export function calendarDateFromYearMonthDay(
  yearMonth: YearMonth,
  day: number,
): CalendarDate {
  return {
    year: yearMonth.year,
    month: yearMonth.month,
    day,
  };
}

export function toDayKey(date: CalendarDate | Date): DayKey {
  const d = date instanceof Date ? toCalendarDate(date) : date;
  return `${d.year}-${pad2(d.month + 1)}-${pad2(d.day)}`;
}

export function toMonthKey(yearMonth: YearMonth | Date): MonthKey {
  const ym = yearMonth instanceof Date ? toYearMonth(yearMonth) : yearMonth;
  return `${ym.year}-${pad2(ym.month + 1)}`;
}

export function parseDayKey(dayKey: DayKey): CalendarDate {
  const [y, m, d] = dayKey.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function parseMonthKey(monthKey: MonthKey): YearMonth {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, month: m - 1 };
}

/** Local midnight for a calendar date. */
export function toLocalDate(date: CalendarDate): Date {
  return new Date(date.year, date.month, date.day);
}

export function startOfMonth(yearMonth: YearMonth): CalendarDate {
  return { year: yearMonth.year, month: yearMonth.month, day: 1 };
}

/** Local midnight at the first day of the month. */
export function startOfMonthDate(yearMonth: YearMonth): Date {
  return new Date(yearMonth.year, yearMonth.month, 1);
}

/** Local midnight at the first day of the following month (exclusive end). */
export function startOfNextMonthDate(yearMonth: YearMonth): Date {
  return new Date(yearMonth.year, yearMonth.month + 1, 1);
}

export function daysInMonth(yearMonth: YearMonth): number {
  return new Date(yearMonth.year, yearMonth.month + 1, 0).getDate();
}

export function addMonths(yearMonth: YearMonth, delta: number): YearMonth {
  const cursor = new Date(yearMonth.year, yearMonth.month + delta, 1);
  return { year: cursor.getFullYear(), month: cursor.getMonth() };
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.month - b.month;
}

export function sameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function sameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

export function weekdayIndex(date: CalendarDate): WeekdayIndex {
  return toLocalDate(date).getDay() as WeekdayIndex;
}

/**
 * Offset of `date`'s weekday within a week that starts on `weekStartsOn`.
 * Example: weekStartsOn=1 (Mon), Sunday → 6.
 */
export function weekdayOffset(
  date: CalendarDate,
  weekStartsOn: WeekdayIndex = 0,
): number {
  const day = weekdayIndex(date);
  return (day - weekStartsOn + 7) % 7;
}

export function addDays(date: CalendarDate, delta: number): CalendarDate {
  const next = toLocalDate(date);
  next.setDate(next.getDate() + delta);
  return toCalendarDate(next);
}

/** DayKey of the first day of the week that contains `dayKey`. */
export function weekStartDayKey(
  dayKey: DayKey,
  weekStartsOn: WeekdayIndex = 0,
): DayKey {
  const date = parseDayKey(dayKey);
  return toDayKey(addDays(date, -weekdayOffset(date, weekStartsOn)));
}

/** Advance a week-start DayKey by `delta` weeks. */
export function addWeeks(weekStartKey: DayKey, delta: number): DayKey {
  return toDayKey(addDays(parseDayKey(weekStartKey), delta * 7));
}

export function todayCalendarDate(): CalendarDate {
  return toCalendarDate(new Date());
}

export function formatYearMonthLabel(
  yearMonth: YearMonth,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(toLocalDate(startOfMonth(yearMonth)));
}

/** e.g. "Fri, Aug 21" */
export function formatDayKeyLabel(dayKey: DayKey, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(toLocalDate(parseDayKey(dayKey)));
}

/** e.g. "9:00 – 9:30" */
export function formatTimeRange(
  startMs: number,
  endMs: number,
  locale?: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(startMs))} – ${formatter.format(new Date(endMs))}`;
}
