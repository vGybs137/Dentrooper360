import { memo, useMemo } from "react";
import { View } from "react-native";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { MONTH_VIEW_CELL_GAP } from "@/constants/schedule";
import {
  EMPTY_MONTH_EVENTS,
  eventsForDayWithNeighbors,
} from "@/helpers/schedule/scheduleEvents";
import { useMonthViewLayout } from "@/hooks/schedule/useMonthViewLayout";
import type { MonthEventsByDay } from "@/hooks/schedule/useMonthAppointmentsCache";
import type { DayPressHandler } from "@/types/schedule";
import {
  addMonths,
  buildWeekCells,
  focusMonthForWeek,
  toMonthKey,
  type DayKey,
} from "@/helpers/schedule/calendar";

import { DayCell, type DayCellEventIndicators } from "./DayCell";

export type MonthWeekStripProps = {
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
function MonthWeekStripComponent({
  weekStartKey,
  eventsByDay = EMPTY_MONTH_EVENTS,
  prevMonthEventsByDay = EMPTY_MONTH_EVENTS,
  nextMonthEventsByDay = EMPTY_MONTH_EVENTS,
  eventIndicators = "dots",
  onDayPress,
}: MonthWeekStripProps) {
  const native = useNativeColors();
  const { eventsAvailableHeight } = useMonthViewLayout();

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

  const rootStyle = useMemo(
    () => ({
      borderRadius: semantic.radius.card,
      backgroundColor: native.surface.default,
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
      <View style={rowStyle}>
        {cells.map((cell) => (
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
    </View>
  );
}

export const MonthWeekStrip = memo(MonthWeekStripComponent);
