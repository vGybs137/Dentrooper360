import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import {
  addDays,
  buildWeekCells,
  MONTH_GRID_COLS,
  parseDayKey,
  type DayKey,
  type MonthKey,
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

/** Primary month for muted styling: mid-week day (stable for the week page). */
function focusMonthForWeek(weekStartKey: DayKey): YearMonth {
  const mid = addDays(parseDayKey(weekStartKey), 3);
  return { year: mid.year, month: mid.month };
}

export type WeekStripProps = {
  weekStartKey: DayKey;
  appointmentsCache?: MonthAppointmentsCache;
  /** Select-only while sheet is open — do not open the sheet on reselect. */
  onDayPress?: (dayKey: DayKey, alreadySelected: boolean) => void;
};

/** Single week row of day cells (sheet-open calendar mode). */
export function WeekStrip({
  weekStartKey,
  appointmentsCache = {},
  onDayPress,
}: WeekStripProps) {
  const theme = useThemeTokens();
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });

  const focusMonth = useMemo(
    () => focusMonthForWeek(weekStartKey),
    [weekStartKey],
  );

  const cells = useMemo(
    () => buildWeekCells(weekStartKey, focusMonth),
    [focusMonth, weekStartKey],
  );

  const baseCellWidth = width > 0 ? Math.floor(width / MONTH_GRID_COLS) : 0;
  const widthRemainder =
    width > 0 ? width - baseCellWidth * MONTH_GRID_COLS : 0;
  const ready = baseCellWidth > 0 && height > 0;

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
      {ready ? (
        <View
          style={{
            flexDirection: "row",
            width,
            height,
          }}
        >
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
                events={eventsForDay(appointmentsCache, cell.dayKey)}
                onDayPress={onDayPress}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
