import { WEEK_VIEW_GRID_EDGE_INSET } from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  clipEventToDay,
  clipEventToWorkingWindow,
  layoutTimedEventsForDay,
  minutesSpanToHeight,
  minutesToYInWorkingWindow,
  timedEventColumnRect,
  type DayKey,
} from "@/utils/calendar";

export type PositionedTimedEvent = {
  event: MonthDayEventPreview;
  top: number;
  height: number;
  left: number;
  width: number;
};

export function layoutDayColumnEvents(
  events: MonthDayEventPreview[],
  dayKey: DayKey,
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap: number,
  gridEdgeInset: number = WEEK_VIEW_GRID_EDGE_INSET,
): PositionedTimedEvent[] {
  const previews = new Map<string, MonthDayEventPreview>();
  const timedInputs = [];

  for (const event of events) {
    const clippedDay = clipEventToDay(event.startTime, event.endTime, dayKey);
    if (!clippedDay) continue;

    const clipped = clipEventToWorkingWindow(
      clippedDay.startMinutes,
      clippedDay.endMinutes,
      startHour,
      endHour,
    );
    if (!clipped) continue;

    previews.set(event.id, event);
    timedInputs.push({
      id: event.id,
      startMinutes: clipped.startMinutes,
      endMinutes: clipped.endMinutes,
    });
  }

  return layoutTimedEventsForDay(timedInputs).map((layout) => {
    const rect = timedEventColumnRect(layout.column, layout.maxColumns);
    return {
      event: previews.get(layout.id)!,
      top:
        gridEdgeInset +
        minutesToYInWorkingWindow(
          layout.startMinutes,
          startHour,
          pxPerMinute,
          hourGap,
        ),
      height: minutesSpanToHeight(
        layout.startMinutes,
        layout.endMinutes,
        pxPerMinute,
        hourGap,
      ),
      left: rect.left,
      width: rect.width,
    };
  });
}
