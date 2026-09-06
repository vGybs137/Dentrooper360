import {
  TIMED_GRID_MAX_OVERLAP,
  TIMED_GRID_OVERFLOW_WIDTH_FRACTION,
  WEEK_VIEW_GRID_EDGE_INSET,
} from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  clipEventToDay,
  clipEventToWorkingWindow,
  minutesSpanToHeight,
  minutesToYInWorkingWindow,
  type DayKey,
} from "@/utils/calendar";
import {
  layoutTimedDayColumn,
  timedEventColumnRect,
  timedOverflowColumnRect,
} from "@/utils/calendar/timedEventLayout";

export type PositionedTimedEvent = {
  event: MonthDayEventPreview;
  top: number;
  height: number;
  left: number;
  width: number;
};

export type PositionedTimedOverflow = {
  count: number;
  top: number;
  height: number;
  left: number;
  width: number;
};

export type DayColumnPixelLayout = {
  events: PositionedTimedEvent[];
  overflows: PositionedTimedOverflow[];
};

export function layoutDayColumnEvents(
  events: MonthDayEventPreview[],
  dayKey: DayKey,
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap: number,
  gridEdgeInset: number = WEEK_VIEW_GRID_EDGE_INSET,
  /** Y-axis anchor; defaults to `startHour`. Use envelope start in week view. */
  gridStartHour: number = startHour,
): DayColumnPixelLayout {
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

  const layout = layoutTimedDayColumn(timedInputs, {
    maxVisible: TIMED_GRID_MAX_OVERLAP,
  });
  const overflowClusterIds = new Set(
    layout.overflows.map((overflow) => overflow.clusterId),
  );
  const eventAreaWidth = 1 - TIMED_GRID_OVERFLOW_WIDTH_FRACTION;

  const positionedEvents = layout.visible.map((item) => {
    const hasOverflowGutter =
      overflowClusterIds.has(item.clusterId) &&
      item.maxColumns === TIMED_GRID_MAX_OVERLAP;
    const areaWidth = hasOverflowGutter ? eventAreaWidth : 1;
    const rect = timedEventColumnRect(item.column, item.maxColumns, areaWidth);

    return {
      event: previews.get(item.id)!,
      top:
        gridEdgeInset +
        minutesToYInWorkingWindow(
          item.startMinutes,
          gridStartHour,
          pxPerMinute,
          hourGap,
        ),
      height: minutesSpanToHeight(
        item.startMinutes,
        item.endMinutes,
        pxPerMinute,
        hourGap,
      ),
      left: rect.left,
      width: rect.width,
    };
  });

  const positionedOverflows = layout.overflows.map((overflow) => {
    const rect = timedOverflowColumnRect(eventAreaWidth);
    return {
      count: overflow.count,
      top:
        gridEdgeInset +
        minutesToYInWorkingWindow(
          overflow.startMinutes,
          gridStartHour,
          pxPerMinute,
          hourGap,
        ),
      height: minutesSpanToHeight(
        overflow.startMinutes,
        overflow.endMinutes,
        pxPerMinute,
        hourGap,
      ),
      left: rect.left,
      width: rect.width,
    };
  });

  return {
    events: positionedEvents,
    overflows: positionedOverflows,
  };
}
