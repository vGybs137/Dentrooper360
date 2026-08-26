/** Fractional horizontal placement within a day column. */
export function timedEventColumnRect(
  column: number,
  maxColumns: number,
  /** When set, columns share this left-side fraction (overflow chip uses the rest). */
  eventAreaWidth: number = 1,
): { left: number; width: number } {
  const cols = Math.max(1, maxColumns || 1);
  const area = Math.min(1, Math.max(0, eventAreaWidth));
  return { left: (column / cols) * area, width: (1 / cols) * area };
}

/** Right-side strip reserved for a +N overflow chip. */
export function timedOverflowColumnRect(
  eventAreaWidth: number,
): { left: number; width: number } {
  const area = Math.min(1, Math.max(0, eventAreaWidth));
  return { left: area, width: 1 - area };
}
