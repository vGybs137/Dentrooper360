import { memo, useMemo } from "react";
import { View } from "react-native";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { MONTH_VIEW_CELL_GAP } from "@/constants/schedule";
import {
  EMPTY_MONTH_EVENTS,
  eventsForDayWithNeighbors,
} from "@/helpers/scheduleEvents";
import { useMonthViewLayout } from "@/hooks/schedule/useMonthViewLayout";
import type { MonthEventsByDay } from "@/hooks/schedule/useMonthAppointmentsCache";
import type { DayPressHandler } from "@/types/schedule";
import {
  addMonths,
  buildMonthGrid,
  MONTH_GRID_COLS,
  toMonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { DayCell, type DayCellEventIndicators } from "./DayCell";

export type MonthGridProps = {
  yearMonth: YearMonth;
  weekStartsOn?: WeekdayIndex;
  /** Day map for this grid's month — stable identity unless this month changes. */
  eventsByDay?: MonthEventsByDay;
  /** Prev/next month maps for leading/trailing out-of-month cells. */
  prevMonthEventsByDay?: MonthEventsByDay;
  nextMonthEventsByDay?: MonthEventsByDay;
  eventIndicators?: DayCellEventIndicators;
  onDayPress?: DayPressHandler;
};

function MonthGridComponent({
  yearMonth,
  weekStartsOn = 0,
  eventsByDay = EMPTY_MONTH_EVENTS,
  prevMonthEventsByDay = EMPTY_MONTH_EVENTS,
  nextMonthEventsByDay = EMPTY_MONTH_EVENTS,
  eventIndicators = "chips",
  onDayPress,
}: MonthGridProps) {
  const native = useNativeColors();
  const { eventsAvailableHeight } = useMonthViewLayout();

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

  const rootStyle = useMemo(
    () => ({
      borderRadius: semantic.radius.card,
      backgroundColor: native.surface.default,
      gap: MONTH_VIEW_CELL_GAP,
    }),
    [native],
  );

  const rowStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: "row" as const,
      minHeight: 0,
      gap: MONTH_VIEW_CELL_GAP,
    }),
    [],
  );

  return (
    <View
      className="w-full flex-1 self-stretch overflow-hidden"
      style={rootStyle}
    >
      {rows.map((row, rowIndex) => (
        <View key={row[0]?.dayKey ?? `row-${rowIndex}`} style={rowStyle}>
          {row.map((cell) => (
            <DayCell
              key={cell.dayKey}
              cell={cell}
              events={eventsForDayWithNeighbors(
                cell.dayKey,
                monthKey,
                eventsByDay,
                prevMonthKey,
                prevMonthEventsByDay,
                nextMonthKey,
                nextMonthEventsByDay,
              )}
              eventsAvailableHeight={eventsAvailableHeight}
              eventIndicators={eventIndicators}
              onDayPress={onDayPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export const MonthGrid = memo(MonthGridComponent);
