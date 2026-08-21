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

  // Floor + distribute remainder so the grid fills measured size (no bottom/side gap).
  const baseCellWidth = width > 0 ? Math.floor(width / MONTH_GRID_COLS) : 0;
  const baseCellHeight = height > 0 ? Math.floor(height / MONTH_GRID_ROWS) : 0;
  const widthRemainder =
    width > 0 ? width - baseCellWidth * MONTH_GRID_COLS : 0;
  const heightRemainder =
    height > 0 ? height - baseCellHeight * MONTH_GRID_ROWS : 0;
  const ready = baseCellWidth > 0 && baseCellHeight > 0;

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
        borderRadius: theme.semantic.radius.card,
        overflow: "hidden",
        backgroundColor: theme.palette.surface.default,
      }}
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
                      events={eventsForDay(appointmentsCache, cell.dayKey)}
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
