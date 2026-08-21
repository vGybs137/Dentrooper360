export type DayEventsSheetHandle = {
  open: () => void;
  close: () => void;
  /** Finger-follow: set visible sheet height in px (no settle animation). */
  setHeight: (height: number) => void;
};

export type MonthPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};

export type WeekPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};
