import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import {
  buildMonthGrid,
  MONTH_GRID_COLS,
  MONTH_GRID_ROWS,
  type DayKey,
  type MonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { DayCell } from "./DayCell";
import type { MonthDayEventPreview } from "./types";

const EMPTY_DAY_EVENTS: MonthDayEventPreview[] = [];

function eventsForDay(
  cache: MonthAppointmentsCache,
  dayKey: DayKey,
): MonthDayEventPreview[] {
  const monthKey = dayKey.slice(0, 7) as MonthKey;
  return cache[monthKey]?.[dayKey] ?? EMPTY_DAY_EVENTS;
}

export type MonthGridProps = {
  yearMonth: YearMonth;
  weekStartsOn?: WeekdayIndex;
  /** Full month cache so in/out-of-month cells can resolve neighbor days. */
  appointmentsCache?: MonthAppointmentsCache;
};

export function MonthGrid({
  yearMonth,
  weekStartsOn = 0,
  appointmentsCache = {},
}: MonthGridProps) {
  const theme = useThemeTokens();
  const borderColor = theme.palette.border.default;
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });

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

  const cellWidth = width > 0 ? Math.floor(width / MONTH_GRID_COLS) : 0;
  const cellHeight = height > 0 ? Math.floor(height / MONTH_GRID_ROWS) : 0;
  const ready = cellWidth > 0 && cellHeight > 0;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === nextWidth && prev.height === nextHeight
        ? prev
        : { width: nextWidth, height: nextHeight },
    );
  };

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
        borderWidth: 1,
        borderColor,
        borderRadius: theme.semantic.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.surface.default,
      }}
      onLayout={onLayout}
    >
      {ready
        ? rows.map((row, rowIndex) => (
            <View
              key={row[0]?.dayKey ?? `row-${rowIndex}`}
              style={{
                flexDirection: "row",
                width: cellWidth * MONTH_GRID_COLS,
                height: cellHeight,
              }}
            >
              {row.map((cell, columnIndex) => (
                <DayCell
                  key={cell.dayKey}
                  cell={cell}
                  width={cellWidth}
                  height={cellHeight}
                  columnIndex={columnIndex}
                  rowIndex={rowIndex}
                  events={eventsForDay(appointmentsCache, cell.dayKey)}
                />
              ))}
            </View>
          ))
        : null}
    </View>
  );
}
