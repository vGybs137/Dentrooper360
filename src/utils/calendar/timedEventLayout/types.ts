/** Minimal timed event input for day-column layout (minutes from local midnight). */
export type TimedEventInput = {
  id: string;
  startMinutes: number;
  endMinutes: number;
};

/** A visible event after column assignment within its overlap cluster. */
export type TimedEventLayout = TimedEventInput & {
  /** 0-based column within the overlap cluster. */
  column: number;
  /** Distinct columns used in this cluster (densified 0..n-1). */
  maxColumns: number;
  /** Shared id for a connected overlap group. */
  clusterId: number;
};

/** +N overflow marker for hidden events in a capped cluster. */
export type TimedOverflowLayout = {
  id: string;
  clusterId: number;
  count: number;
  startMinutes: number;
  endMinutes: number;
  hiddenIds: string[];
};

/** Full layout result for one day column. */
export type TimedDayLayout = {
  visible: TimedEventLayout[];
  overflows: TimedOverflowLayout[];
};
