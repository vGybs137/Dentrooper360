import {
  parseDayKey,
  toLocalDate,
  type DayKey,
} from "@/helpers/schedule/calendar";

export type DayKeyedGroup = {
  dayKey: DayKey;
};

/**
 * Index of `todayKey`, or the temporally closest day group
 * (prefer future on equal distance). Returns -1 when empty.
 */
export function findClosestDayGroupIndex(
  groups: readonly DayKeyedGroup[],
  todayKey: DayKey,
): number {
  if (groups.length === 0) {
    return -1;
  }

  const todayIndex = groups.findIndex((group) => group.dayKey === todayKey);
  if (todayIndex >= 0) {
    return todayIndex;
  }

  const todayMs = toLocalDate(parseDayKey(todayKey)).getTime();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < groups.length; index += 1) {
    const dayMs = toLocalDate(parseDayKey(groups[index]!.dayKey)).getTime();
    const distance = Math.abs(dayMs - todayMs);

    if (
      distance < bestDistance ||
      (distance === bestDistance && dayMs >= todayMs)
    ) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

/** Group items by a day key derived from each item. */
export function groupByDayKey<T>(
  items: readonly T[],
  getDayKey: (item: T) => DayKey,
): { dayKey: DayKey; items: T[] }[] {
  const groups = new Map<DayKey, T[]>();

  for (const item of items) {
    const dayKey = getDayKey(item);
    const existing = groups.get(dayKey);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(dayKey, [item]);
    }
  }

  return [...groups.entries()].map(([dayKey, grouped]) => ({
    dayKey,
    items: grouped,
  }));
}
