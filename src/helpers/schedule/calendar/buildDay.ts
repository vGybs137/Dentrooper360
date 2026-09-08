import {
  addDays,
  parseDayKey,
  toDayKey,
  weekdayIndex,
} from "./dateKeys";
import type { DayKey } from "./types";

/** Days before/after the center day in the pager window. */
export const DAY_PAGER_RADIUS = 120;

/** Day view never shows Sundays (`WeekdayIndex` 0). */
export function isSundayDayKey(dayKey: DayKey): boolean {
  return weekdayIndex(parseDayKey(dayKey)) === 0;
}

/** If `dayKey` is Sunday, return the following Monday; otherwise unchanged. */
export function coerceDayViewDayKey(dayKey: DayKey): DayKey {
  if (!isSundayDayKey(dayKey)) {
    return dayKey;
  }

  return toDayKey(addDays(parseDayKey(dayKey), 1));
}

export function buildDayWindow(
  centerDayKey: DayKey,
  radius: number = DAY_PAGER_RADIUS,
): DayKey[] {
  const center = parseDayKey(centerDayKey);
  const days: DayKey[] = [];

  for (let offset = -radius; offset <= radius; offset++) {
    days.push(toDayKey(addDays(center, offset)));
  }

  return days;
}

/**
 * Day-pager window centered on `centerDayKey`, skipping Sundays so swipe
 * navigation goes Saturday → Monday.
 */
export function buildDayViewWindow(
  centerDayKey: DayKey,
  radius: number = DAY_PAGER_RADIUS,
): DayKey[] {
  const centerKey = coerceDayViewDayKey(centerDayKey);
  const center = parseDayKey(centerKey);
  const before: DayKey[] = [];
  let offset = -1;

  while (before.length < radius) {
    const dayKey = toDayKey(addDays(center, offset));
    if (!isSundayDayKey(dayKey)) {
      before.unshift(dayKey);
    }
    offset -= 1;
  }

  const after: DayKey[] = [];
  offset = 1;
  while (after.length < radius) {
    const dayKey = toDayKey(addDays(center, offset));
    if (!isSundayDayKey(dayKey)) {
      after.push(dayKey);
    }
    offset += 1;
  }

  return [...before, centerKey, ...after];
}
