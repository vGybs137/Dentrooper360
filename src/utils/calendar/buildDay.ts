import { addDays, parseDayKey, toDayKey } from "./dateKeys";
import type { DayKey } from "./types";

/** Days before/after the center day in the pager window. */
export const DAY_PAGER_RADIUS = 120;

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
