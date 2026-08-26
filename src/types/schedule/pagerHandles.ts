export type DayEventsSheetHandle = {
  open: () => void;
  close: () => void;
};

export type MonthPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};

export type WeekPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};
