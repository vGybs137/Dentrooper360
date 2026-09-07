import { parseDayKey, toLocalDate } from "./dateKeys";
import type { DayKey } from "./types";

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = MINUTES_PER_HOUR * 24;

/** First hour row shown on initial scroll (local time). */
export const DEFAULT_START_HOUR = 6;

/** Last hour row label shown in the default visible window (local time). */
export const DEFAULT_END_HOUR = 22;

export type HourLabel = {
  /** 0–23 local hour. */
  hour: number;
  label: string;
};

export type ClippedDayEvent = {
  /** Minutes from local midnight, inclusive start. */
  startMinutes: number;
  /** Minutes from local midnight, exclusive end in practice for layout height. */
  endMinutes: number;
};

function clampMinutes(minutes: number): number {
  return Math.max(0, Math.min(minutes, MINUTES_PER_DAY));
}

/**
 * Maps minutes-from-midnight to Y offset in the timed grid.
 * `hourGap` is added once per completed hour (between hour rows).
 */
export function minutesToY(
  minutes: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  const clamped = clampMinutes(minutes);
  const fullHours = Math.floor(clamped / MINUTES_PER_HOUR);
  return fullHours * hourGap + clamped * pxPerMinute;
}

/** Linear height for a duration when hour gaps are not crossed (or gap is 0). */
export function durationToHeight(
  durationMinutes: number,
  pxPerMinute: number,
): number {
  return Math.max(0, durationMinutes) * pxPerMinute;
}

/** Accurate block height when `hourGap` inserts space between hour rows. */
export function minutesSpanToHeight(
  startMinutes: number,
  endMinutes: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  return Math.max(
    0,
    minutesToY(endMinutes, pxPerMinute, hourGap) -
      minutesToY(startMinutes, pxPerMinute, hourGap),
  );
}

/** Inverse of {@link minutesToY} for hit-testing / snap (local minutes 0–1440). */
export function yToMinutes(
  y: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  if (pxPerMinute <= 0) return 0;

  if (hourGap <= 0) {
    return clampMinutes(y / pxPerMinute);
  }

  const hourBlock = MINUTES_PER_HOUR * pxPerMinute + hourGap;
  const fullHours = Math.max(0, Math.floor(y / hourBlock));
  const remainderY = y - fullHours * hourBlock;
  const remainderMinutes = remainderY / pxPerMinute;
  return clampMinutes(fullHours * MINUTES_PER_HOUR + remainderMinutes);
}

/** Total scrollable height for a full 24h day column. */
export function gridHeightForDay(pxPerMinute: number, hourGap = 0): number {
  return minutesToY(MINUTES_PER_DAY, pxPerMinute, hourGap);
}

/** Inclusive working-hour window as minutes from local midnight. */
export function workingWindowMinutes(
  startHour: number,
  endHour: number,
): { startMinutes: number; endMinutes: number } {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  return {
    startMinutes: start * MINUTES_PER_HOUR,
    endMinutes: (end + 1) * MINUTES_PER_HOUR,
  };
}

/** Grid height for an inclusive local hour range (`endHour` label row included). */
export function gridHeightForHourRange(
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  const { startMinutes, endMinutes } = workingWindowMinutes(startHour, endHour);
  return minutesSpanToHeight(startMinutes, endMinutes, pxPerMinute, hourGap);
}

/** Inclusive hour-row count for a working window (`endHour` included). */
export function hourRowCount(startHour: number, endHour: number): number {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  return end - start + 1;
}

/**
 * Hour row height so the working-hours grid fills `viewportHeight` with optional
 * scroll room. Never shrinks below `minHourHeight` (long days keep scrolling).
 */
export function hourHeightToFillViewport({
  startHour,
  endHour,
  viewportHeight,
  hourGap = 0,
  gridEdgeInset = 0,
  minHourHeight,
  scrollExtra = 0,
}: {
  startHour: number;
  endHour: number;
  viewportHeight: number;
  hourGap?: number;
  gridEdgeInset?: number;
  minHourHeight: number;
  scrollExtra?: number;
}): number {
  const rows = hourRowCount(startHour, endHour);
  if (rows <= 0 || viewportHeight <= 0) {
    return minHourHeight;
  }

  const targetContentHeight = viewportHeight + Math.max(0, scrollExtra);
  const availableForRows = targetContentHeight - gridEdgeInset * 2;
  // contentHeight = rows * (hourHeight + hourGap) + 2 * inset
  const computed = availableForRows / rows - hourGap;
  return Math.max(minHourHeight, computed);
}

/** Maps absolute local minutes into a working-hours grid anchored at `startHour`. */
export function minutesToYInWorkingWindow(
  minutesFromMidnight: number,
  startHour: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  const windowStart = startHour * MINUTES_PER_HOUR;
  return minutesToY(minutesFromMidnight - windowStart, pxPerMinute, hourGap);
}

/** Inverse of {@link minutesToYInWorkingWindow} for grid hit-testing. */
export function yToMinutesInWorkingWindow(
  y: number,
  startHour: number,
  pxPerMinute: number,
  hourGap = 0,
): number {
  const windowStart = startHour * MINUTES_PER_HOUR;
  return windowStart + yToMinutes(y, pxPerMinute, hourGap);
}

export function isMinuteInWorkingWindow(
  minutesFromMidnight: number,
  startHour: number,
  endHour: number,
): boolean {
  const { startMinutes, endMinutes } = workingWindowMinutes(startHour, endHour);
  return (
    minutesFromMidnight >= startMinutes && minutesFromMidnight < endMinutes
  );
}

/** Clips a day-local timed span to the working-hour window. */
export function clipEventToWorkingWindow(
  startMinutes: number,
  endMinutes: number,
  startHour: number,
  endHour: number,
): ClippedDayEvent | null {
  const { startMinutes: windowStart, endMinutes: windowEnd } =
    workingWindowMinutes(startHour, endHour);
  const clipStart = Math.max(startMinutes, windowStart);
  const clipEnd = Math.min(endMinutes, windowEnd);
  if (clipStart >= clipEnd) return null;
  return { startMinutes: clipStart, endMinutes: clipEnd };
}

/**
 * Hour labels for the time gutter and horizontal grid lines.
 * `endHour` is inclusive (e.g. 6–22 → 6am … 10pm rows).
 */
export function buildHourLabels(
  startHour: number,
  endHour: number,
  options?: {
    locale?: string;
    hour12?: boolean;
  },
): HourLabel[] {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  const formatter = new Intl.DateTimeFormat(options?.locale, {
    hour: "numeric",
    ...(options?.hour12 === undefined ? {} : { hour12: options.hour12 }),
  });
  const anchor = new Date(2000, 0, 1);
  const labels: HourLabel[] = [];

  for (let hour = start; hour <= end; hour++) {
    anchor.setHours(hour, 0, 0, 0);
    labels.push({ hour, label: formatter.format(anchor) });
  }

  return labels;
}

/**
 * Clips a timed event to one local calendar day.
 * Returns null when the event does not intersect `dayKey`.
 */
export function clipEventToDay(
  startMs: number,
  endMs: number,
  dayKey: DayKey,
): ClippedDayEvent | null {
  const dayStartMs = toLocalDate(parseDayKey(dayKey)).getTime();
  const dayEndMs = dayStartMs + MINUTES_PER_DAY * 60 * 1000;

  const clipStartMs = Math.max(startMs, dayStartMs);
  const clipEndMs = Math.min(endMs, dayEndMs);

  if (clipStartMs >= clipEndMs) return null;

  return {
    startMinutes: (clipStartMs - dayStartMs) / 60_000,
    endMinutes: (clipEndMs - dayStartMs) / 60_000,
  };
}
