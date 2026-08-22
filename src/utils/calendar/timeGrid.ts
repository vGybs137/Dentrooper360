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

/**
 * Hour labels for the time gutter and horizontal grid lines.
 * `endHour` is inclusive (e.g. 6–22 → 6am … 10pm rows).
 */
export function buildHourLabels(
  startHour: number,
  endHour: number,
  locale?: string,
): HourLabel[] {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  const formatter = new Intl.DateTimeFormat(locale, { hour: "numeric" });
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
