import { memo, useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import type { MonthEventsByDay } from "@/hooks/schedule/useMonthAppointmentsCache";
import {
  addMonths,
  buildWeekCells,
  focusMonthForWeek,
  MONTH_GRID_COLS,
  toMonthKey,
  type DayKey,
} from "@/utils/calendar";

import { DayCell, type DayCellEventIndicators } from "./DayCell";
import {
  EMPTY_MONTH_EVENTS,
  eventsForDayWithNeighbors,
} from "@/helpers/scheduleEvents";
import type { DayPressHandler } from "@/types/schedule";

export type WeekStripProps = {
  weekStartKey: DayKey;
  /** Day map for the week’s focus month. */
  eventsByDay?: MonthEventsByDay;
  prevMonthEventsByDay?: MonthEventsByDay;
  nextMonthEventsByDay?: MonthEventsByDay;
  eventIndicators?: DayCellEventIndicators;
  /** Select-only while sheet is open — do not open the sheet on reselect. */
  onDayPress?: DayPressHandler;
};

/** Single week row of day cells (sheet-open calendar mode). */
function WeekStripComponent({
  weekStartKey,
  eventsByDay = EMPTY_MONTH_EVENTS,
  prevMonthEventsByDay = EMPTY_MONTH_EVENTS,
  nextMonthEventsByDay = EMPTY_MONTH_EVENTS,
  eventIndicators = "dots",
  onDayPress,
}: WeekStripProps) {
  const native = useNativeColors();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });

  const focusMonth = useMemo(
    () => focusMonthForWeek(weekStartKey),
    [weekStartKey],
  );

  const monthKey = toMonthKey(focusMonth);
  const prevMonthKey = toMonthKey(addMonths(focusMonth, -1));
  const nextMonthKey = toMonthKey(addMonths(focusMonth, 1));

  const cells = useMemo(
    () => buildWeekCells(weekStartKey, focusMonth),
    [focusMonth, weekStartKey],
  );

  const baseCellWidth = width > 0 ? Math.floor(width / MONTH_GRID_COLS) : 0;
  const widthRemainder =
    width > 0 ? width - baseCellWidth * MONTH_GRID_COLS : 0;
  const ready = baseCellWidth > 0 && height > 0;

  const rootStyle = useMemo(
    () => ({
      borderRadius: semantic.radius.card,
      backgroundColor: native.surface.default,
    }),
    [native],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === nextWidth && prev.height === nextHeight
        ? prev
        : { width: nextWidth, height: nextHeight },
    );
  }, []);

  return (
    <View
      className="w-full flex-1 self-stretch overflow-hidden"
      style={rootStyle}
      onLayout={onLayout}
    >
      {ready ? (
        <View style={{ flexDirection: "row", width, height }}>
          {cells.map((cell, columnIndex) => {
            const cellWidth =
              baseCellWidth + (columnIndex < widthRemainder ? 1 : 0);
            return (
              <DayCell
                key={cell.dayKey}
                cell={cell}
                width={cellWidth}
                height={height}
                columnIndex={columnIndex}
                rowIndex={0}
                events={eventsForDayWithNeighbors(
                  cell.dayKey,
                  monthKey,
                  eventsByDay,
                  prevMonthKey,
                  prevMonthEventsByDay,
                  nextMonthKey,
                  nextMonthEventsByDay,
                )}
                eventIndicators={eventIndicators}
                onDayPress={onDayPress}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const WeekStrip = memo(WeekStripComponent);
