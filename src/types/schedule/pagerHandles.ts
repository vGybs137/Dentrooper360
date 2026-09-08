export type DayEventsSheetHandle = {
  open: () => void;
  close: () => void;
};

export type MonthPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};

export type MonthWeekPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};

/** @deprecated Use `MonthWeekPagerHandle`. */
export type WeekPagerHandle = MonthWeekPagerHandle;
