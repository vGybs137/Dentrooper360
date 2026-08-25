import { memo, useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { MonthEventsByDay } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import {
  addMonths,
  buildMonthGrid,
  MONTH_GRID_COLS,
  MONTH_GRID_ROWS,
  toMonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { DayCell } from "./DayCell";
import {
  EMPTY_MONTH_EVENTS,
  eventsForDayWithNeighbors,
} from "@/helpers/scheduleEvents";
import type { DayPressHandler } from "@/types/schedule";

export type MonthGridProps = {
  yearMonth: YearMonth;
  weekStartsOn?: WeekdayIndex;
  /** Day map for this grid's month — stable identity unless this month changes. */
  eventsByDay?: MonthEventsByDay;
  /** Prev/next month maps for leading/trailing out-of-month cells. */
  prevMonthEventsByDay?: MonthEventsByDay;
  nextMonthEventsByDay?: MonthEventsByDay;
  onDayPress?: DayPressHandler;
};

function MonthGridComponent({
  yearMonth,
  weekStartsOn = 0,
  eventsByDay = EMPTY_MONTH_EVENTS,
  prevMonthEventsByDay = EMPTY_MONTH_EVENTS,
  nextMonthEventsByDay = EMPTY_MONTH_EVENTS,
  onDayPress,
}: MonthGridProps) {
  const theme = useThemeTokens();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });

  const monthKey = toMonthKey(yearMonth);
  const prevMonthKey = toMonthKey(addMonths(yearMonth, -1));
  const nextMonthKey = toMonthKey(addMonths(yearMonth, 1));

  const grid = useMemo(
    () => buildMonthGrid(yearMonth, { weekStartsOn }),
    [yearMonth, weekStartsOn],
  );

  const rows = useMemo(() => {
    const next: (typeof grid.cells)[] = [];
    for (let i = 0; i < grid.cells.length; i += MONTH_GRID_COLS) {
      next.push(grid.cells.slice(i, i + MONTH_GRID_COLS));
    }
    return next;
  }, [grid.cells]);

  const baseCellWidth = width > 0 ? Math.floor(width / MONTH_GRID_COLS) : 0;
  const baseCellHeight = height > 0 ? Math.floor(height / MONTH_GRID_ROWS) : 0;
  const widthRemainder =
    width > 0 ? width - baseCellWidth * MONTH_GRID_COLS : 0;
  const heightRemainder =
    height > 0 ? height - baseCellHeight * MONTH_GRID_ROWS : 0;
  const ready = baseCellWidth > 0 && baseCellHeight > 0;

  const rootStyle = useMemo(
    () => ({
      borderRadius: theme.semantic.radius.card,
      backgroundColor: theme.palette.surface.default,
    }),
    [theme],
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
      {ready
        ? rows.map((row, rowIndex) => {
            const rowHeight =
              baseCellHeight + (rowIndex < heightRemainder ? 1 : 0);
            return (
              <View
                key={row[0]?.dayKey ?? `row-${rowIndex}`}
                style={{
                  flexDirection: "row",
                  width,
                  height: rowHeight,
                }}
              >
                {row.map((cell, columnIndex) => {
                  const cellWidth =
                    baseCellWidth + (columnIndex < widthRemainder ? 1 : 0);
                  return (
                    <DayCell
                      key={cell.dayKey}
                      cell={cell}
                      width={cellWidth}
                      height={rowHeight}
                      columnIndex={columnIndex}
                      rowIndex={rowIndex}
                      events={eventsForDayWithNeighbors(
                        cell.dayKey,
                        monthKey,
                        eventsByDay,
                        prevMonthKey,
                        prevMonthEventsByDay,
                        nextMonthKey,
                        nextMonthEventsByDay,
                      )}
                      onDayPress={onDayPress}
                    />
                  );
                })}
              </View>
            );
          })
        : null}
    </View>
  );
}

export const MonthGrid = memo(MonthGridComponent);
