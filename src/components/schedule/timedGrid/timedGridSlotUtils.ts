import { ADD_APPOINTMENT_SLOT_DURATION_MINUTES } from "@/stores/addAppointmentStore";
import {
  MINUTES_PER_HOUR,
  parseDayKey,
  toDayKey,
  toLocalDate,
  yToMinutesInWorkingWindow,
  type DayKey,
} from "@/utils/calendar";

export const TIMED_GRID_SLOT_SNAP_MINUTES = MINUTES_PER_HOUR;

export function dateFromDayKeyAndMinutes(
  dayKey: DayKey,
  minutes: number,
): Date {
  const date = toLocalDate(parseDayKey(dayKey));
  date.setHours(
    Math.floor(minutes / MINUTES_PER_HOUR),
    minutes % MINUTES_PER_HOUR,
    0,
    0,
  );
  return date;
}

export function minutesFromDate(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

export function slotMatchesDay(
  start: Date,
  dayKey: DayKey,
): boolean {
  return toDayKey(start) === dayKey;
}

export function snapMinutesToGrid(
  minutes: number,
  startHour: number,
  endHour: number,
  snapMinutes = TIMED_GRID_SLOT_SNAP_MINUTES,
): number {
  const windowStart = startHour * MINUTES_PER_HOUR;
  const windowEnd =
    (endHour + 1) * MINUTES_PER_HOUR -
    ADD_APPOINTMENT_SLOT_DURATION_MINUTES;
  const snapped = Math.floor(minutes / snapMinutes) * snapMinutes;
  return Math.max(windowStart, Math.min(snapped, windowEnd));
}

export function minutesFromGridY(
  y: number,
  gridEdgeInset: number,
  gridStartHour: number,
  windowStartHour: number,
  windowEndHour: number,
  pxPerMinute: number,
  hourGap: number,
): number {
  const rawMinutes = yToMinutesInWorkingWindow(
    Math.max(0, y - gridEdgeInset),
    gridStartHour,
    pxPerMinute,
    hourGap,
  );
  return snapMinutesToGrid(rawMinutes, windowStartHour, windowEndHour);
}
