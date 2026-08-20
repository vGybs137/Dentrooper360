/** Calendar month as year + 0-based month (Date-compatible). */
export type YearMonth = {
  year: number;
  /** 0 = January … 11 = December */
  month: number;
};

/** Local calendar day (no time-of-day). */
export type CalendarDate = {
  year: number;
  /** 0 = January … 11 = December */
  month: number;
  /** 1–31 */
  day: number;
};

/** `YYYY-MM` */
export type MonthKey = string;

/** `YYYY-MM-DD` */
export type DayKey = string;

/** 0 = Sunday … 6 = Saturday (same as `Date#getDay`). */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DayCellModel = {
  date: CalendarDate;
  dayKey: DayKey;
  /** True when this cell belongs to the grid’s focus month. */
  inCurrentMonth: boolean;
  isToday: boolean;
};

export type MonthGrid = {
  yearMonth: YearMonth;
  monthKey: MonthKey;
  /** Always 42 cells (6 weeks × 7 days), row-major. */
  cells: DayCellModel[];
};
