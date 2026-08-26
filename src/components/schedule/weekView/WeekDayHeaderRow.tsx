import { memo, useMemo } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native-gesture-handler";

import { ThemedText } from "@/components/ui";
import { MONTH_VIEW_DAY_NUMBER_SIZE } from "@/constants/schedule";
import { useWeekHighlightDayKey } from "@/contexts/WeekHighlightDayContext";
import { weekdayLabels } from "@/helpers/weekdayLabels";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
import type { DayPressHandler } from "@/types/schedule";
import {
  buildWeekCells,
  focusMonthForWeek,
  weekdayIndex,
  type DayCellModel,
  type DayKey,
  type WeekdayIndex,
} from "@/utils/calendar";

export type WeekDayHeaderRowProps = {
  weekStartKey: DayKey;
  weekStartsOn?: WeekdayIndex;
  gutterWidth: number;
  onDayPress?: DayPressHandler;
  onLayout?: (event: LayoutChangeEvent) => void;
  /**
   * When true, selection comes from WeekHighlightDayContext (week sheet)
   * instead of the shared calendar selection store.
   */
  useHighlightContext?: boolean;
};

type WeekDayHeaderCellProps = {
  cell: DayCellModel;
  weekdayLabel: string;
  onDayPress?: DayPressHandler;
  useHighlightContext?: boolean;
};

function WeekDayHeaderCell({
  cell,
  weekdayLabel,
  onDayPress,
  useHighlightContext = false,
}: WeekDayHeaderCellProps) {
  const theme = useThemeTokens();
  const highlightDayKey = useWeekHighlightDayKey();
  const storeSelected = useIsCalendarDaySelected(cell.dayKey);
  const selected = useHighlightContext
    ? highlightDayKey === cell.dayKey
    : storeSelected;
  const isSunday = weekdayIndex(cell.date) === 0;

  const dayCircleStyle = useMemo(
    () => ({
      width: MONTH_VIEW_DAY_NUMBER_SIZE,
      height: MONTH_VIEW_DAY_NUMBER_SIZE,
      borderRadius: MONTH_VIEW_DAY_NUMBER_SIZE / 2,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      overflow: "hidden" as const,
      backgroundColor: selected
        ? theme.palette.brand.default
        : cell.isToday
          ? theme.palette.brand.subtle
          : "transparent",
    }),
    [cell.isToday, selected, theme],
  );

  const dayTone = selected
    ? "inverse"
    : cell.isToday
      ? "brand"
      : isSunday
        ? "alert"
        : "default";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}`}
      unstable_pressDelay={0}
      onPress={() => {
        const alreadySelected = useHighlightContext
          ? highlightDayKey === cell.dayKey
          : useCalendarSelectionStore.getState().selectedDayKey === cell.dayKey;
        onDayPress?.(cell.dayKey, alreadySelected);
        selectCalendarDay(cell.dayKey);
      }}
      style={({ pressed }) => [
        { flex: 1, alignItems: "center", alignSelf: "stretch" },
        pressed && !selected ? { opacity: 0.72 } : null,
      ]}
    >
      <ThemedText tone={isSunday ? "alert" : "muted"} variant="label">
        {weekdayLabel}
      </ThemedText>
      <View style={dayCircleStyle}>
        <ThemedText tone={dayTone} variant="label">
          {cell.date.day}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function WeekDayHeaderRowComponent({
  weekStartKey,
  weekStartsOn = 0,
  gutterWidth,
  onDayPress,
  onLayout,
  useHighlightContext = false,
}: WeekDayHeaderRowProps) {
  const theme = useThemeTokens();
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);
  const cells = useMemo(
    () => buildWeekCells(weekStartKey, focusMonthForWeek(weekStartKey)),
    [weekStartKey],
  );

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View className="w-full self-stretch" style={rootStyle} onLayout={onLayout}>
      <View style={{ width: gutterWidth }} />
      {cells.map((cell, index) => (
        <WeekDayHeaderCell
          key={cell.dayKey}
          cell={cell}
          weekdayLabel={labels[index] ?? ""}
          onDayPress={onDayPress}
          useHighlightContext={useHighlightContext}
        />
      ))}
    </View>
  );
}

export const WeekDayHeaderRow = memo(WeekDayHeaderRowComponent);
