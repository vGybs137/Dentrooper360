export type TimedEventInput = {
  id: string;
  /** Minutes from local midnight. */
  startMinutes: number;
  /** Minutes from local midnight. */
  endMinutes: number;
};

export type LaidOutTimedEvent = TimedEventInput & {
  /** 0-based column within the overlap cluster. */
  column: number;
  /** Columns used by the cluster this event belongs to. */
  maxColumns: number;
};

type ActivePlacement = {
  laidOutIndex: number;
  column: number;
  endMinutes: number;
};

/**
 * Assigns side-by-side columns for overlapping timed events on one day.
 * Greedy leftmost-free-column (AOSP Calendar timed pass).
 *
 * Render with `left = column / maxColumns`, `width = 1 / maxColumns`.
 */
export function layoutTimedEventsForDay(
  events: TimedEventInput[],
): LaidOutTimedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) =>
      a.startMinutes - b.startMinutes ||
      a.endMinutes - b.endMinutes ||
      a.id.localeCompare(b.id),
  );

  const laidOut: LaidOutTimedEvent[] = [];
  let active: ActivePlacement[] = [];
  let clusterIndices: number[] = [];
  let maxCols = 0;

  const finalizeCluster = () => {
    for (const index of clusterIndices) {
      laidOut[index].maxColumns = maxCols;
    }
    clusterIndices = [];
    maxCols = 0;
  };

  for (const event of sorted) {
    active = active.filter((slot) => slot.endMinutes > event.startMinutes);

    if (active.length === 0 && clusterIndices.length > 0) {
      finalizeCluster();
    }

    const usedColumns = new Set(active.map((slot) => slot.column));
    let column = 0;
    while (usedColumns.has(column)) {
      column += 1;
    }

    const laidOutIndex = laidOut.length;
    laidOut.push({
      ...event,
      column,
      maxColumns: 1,
    });

    active.push({
      laidOutIndex,
      column,
      endMinutes: event.endMinutes,
    });
    clusterIndices.push(laidOutIndex);
    maxCols = Math.max(maxCols, active.length);
  }

  if (clusterIndices.length > 0) {
    finalizeCluster();
  }

  return laidOut;
}

/** Fractional horizontal placement within a day column. */
export function timedEventColumnRect(
  column: number,
  maxColumns: number,
): { left: number; width: number } {
  const cols = Math.max(1, maxColumns);
  return { left: column / cols, width: 1 / cols };
}
