import dayjs from "dayjs";

import { dayjsTimePattern } from "@/helpers/timeFormat";
import type { HourFormat } from "@/stores/schedulePreferencesStore";
import {
  MINUTES_PER_HOUR,
  workingWindowMinutes,
} from "@/utils/calendar";

export type DayBusyInterval = {
  startTime: number;
  endTime: number;
};

export type DayFreeInterval = {
  startMinutes: number;
  endMinutes: number;
};

function minutesFromDayStart(timestampMs: number, dayStartMs: number): number {
  return (timestampMs - dayStartMs) / 60_000;
}

function mergeBusyIntervals(
  intervals: DayFreeInterval[],
): DayFreeInterval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort(
    (left, right) => left.startMinutes - right.startMinutes,
  );
  const merged: DayFreeInterval[] = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.startMinutes <= last.endMinutes) {
      last.endMinutes = Math.max(last.endMinutes, current.endMinutes);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

export function computeDayFreeIntervals(
  events: readonly DayBusyInterval[],
  startHour: number,
  endHour: number,
  dayStartMs: number,
): DayFreeInterval[] {
  const { startMinutes, endMinutes } = workingWindowMinutes(startHour, endHour);

  const busy = mergeBusyIntervals(
    events
      .map((event) => ({
        startMinutes: Math.max(
          startMinutes,
          minutesFromDayStart(event.startTime, dayStartMs),
        ),
        endMinutes: Math.min(
          endMinutes,
          minutesFromDayStart(event.endTime, dayStartMs),
        ),
      }))
      .filter((interval) => interval.endMinutes > interval.startMinutes),
  );

  const free: DayFreeInterval[] = [];
  let cursor = startMinutes;

  for (const interval of busy) {
    if (interval.startMinutes > cursor) {
      free.push({
        startMinutes: cursor,
        endMinutes: interval.startMinutes,
      });
    }

    cursor = Math.max(cursor, interval.endMinutes);
  }

  if (cursor < endMinutes) {
    free.push({ startMinutes: cursor, endMinutes });
  }

  return free;
}

function dateFromDayStartMinutes(
  dayStartMs: number,
  minutes: number,
): Date {
  const date = new Date(dayStartMs);
  date.setHours(
    Math.floor(minutes / MINUTES_PER_HOUR),
    minutes % MINUTES_PER_HOUR,
    0,
    0,
  );
  return date;
}

export function formatDayFreeIntervalLabel(
  interval: DayFreeInterval,
  dayStartMs: number,
  hourFormat?: HourFormat,
): string {
  const pattern = dayjsTimePattern(hourFormat);
  const startLabel = dayjs(
    dateFromDayStartMinutes(dayStartMs, interval.startMinutes),
  ).format(pattern);
  const endLabel = dayjs(
    dateFromDayStartMinutes(dayStartMs, interval.endMinutes),
  ).format(pattern);

  return `${startLabel} – ${endLabel}`;
}

export function formatDayFreeHourLabels(
  intervals: readonly DayFreeInterval[],
  dayStartMs: number,
  hourFormat?: HourFormat,
): string[] {
  return intervals.map((interval) =>
    formatDayFreeIntervalLabel(interval, dayStartMs, hourFormat),
  );
}

/** Half-open [start, end) overlap against existing busy intervals. */
export function selectionOverlapsBusyIntervals(
  selectionStartMs: number,
  selectionEndMs: number,
  busy: readonly DayBusyInterval[],
): boolean {
  if (selectionEndMs <= selectionStartMs) {
    return false;
  }

  return busy.some(
    (interval) =>
      selectionStartMs < interval.endTime &&
      interval.startTime < selectionEndMs,
  );
}

/**
 * True when the selection is not fully inside the day's working window,
 * or the day has no working hours.
 */
export function selectionOutsideWorkingHours(
  selectionStartMs: number,
  selectionEndMs: number,
  dayStartMs: number,
  dayHours: { startHour: number; endHour: number } | null,
): boolean {
  if (selectionEndMs <= selectionStartMs) {
    return false;
  }

  if (!dayHours) {
    return true;
  }

  const { startMinutes, endMinutes } = workingWindowMinutes(
    dayHours.startHour,
    dayHours.endHour,
  );
  const selectionStartMinutes = minutesFromDayStart(
    selectionStartMs,
    dayStartMs,
  );
  const selectionEndMinutes = minutesFromDayStart(selectionEndMs, dayStartMs);

  return (
    selectionStartMinutes < startMinutes || selectionEndMinutes > endMinutes
  );
}
