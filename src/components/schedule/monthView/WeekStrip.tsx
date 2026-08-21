import { memo, useCallback, useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import {
  buildWeekCells,
  focusMonthForWeek,
  MONTH_GRID_COLS,
  type DayKey,
} from "@/utils/calendar";

import { DayCell } from "./DayCell";
import { eventsForDay } from "@/helpers/scheduleEvents";
import type { DayPressHandler } from "@/types/schedule";

export type WeekStripProps = {
  weekStartKey: DayKey;
  appointmentsCache?: MonthAppointmentsCache;
  /** Select-only while sheet is open — do not open the sheet on reselect. */
  onDayPress?: DayPressHandler;
};

/** Single week row of day cells (sheet-open calendar mode). */
function WeekStripComponent({
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

export const WeekStrip = memo(WeekStripComponent);
