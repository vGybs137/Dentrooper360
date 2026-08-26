import { MINUTES_PER_HOUR, minutesToYInWorkingWindow } from "@/utils/calendar";

export function localMinutesFromMidnight(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

export function buildHourLineTops(
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap: number,
  gridEdgeInset: number,
): number[] {
  const lines: number[] = [];
  for (let hour = startHour; hour <= endHour + 1; hour++) {
    lines.push(
      gridEdgeInset +
        minutesToYInWorkingWindow(
          hour * MINUTES_PER_HOUR,
          startHour,
          pxPerMinute,
          hourGap,
        ),
    );
  }
  return lines;
}

export function buildHalfHourLineTops(
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap: number,
  gridEdgeInset: number,
): number[] {
  const lines: number[] = [];
  const windowStartMinutes = startHour * MINUTES_PER_HOUR;
  const windowEndMinutes = (endHour + 1) * MINUTES_PER_HOUR;

  for (
    let minutes = windowStartMinutes + 30;
    minutes < windowEndMinutes;
    minutes += MINUTES_PER_HOUR
  ) {
    lines.push(
      gridEdgeInset +
        minutesToYInWorkingWindow(minutes, startHour, pxPerMinute, hourGap),
    );
  }
  return lines;
}

export function nowLineYForMinutes(
  nowMinutes: number,
  startHour: number,
  pxPerMinute: number,
  hourGap: number,
  gridEdgeInset: number,
): number {
  return (
    gridEdgeInset +
    minutesToYInWorkingWindow(nowMinutes, startHour, pxPerMinute, hourGap)
  );
}
