import { memo, useMemo } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { Button, ThemedText } from "@/components/ui";
import { MONTH_VIEW_DAY_NUMBER_SIZE } from "@/constants/schedule";
import { useWeekHighlightDayKey } from "@/contexts/WeekHighlightDayContext";
import { weekdayLabels } from "@/helpers/weekdayLabels";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
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
  const native = useNativeColors();
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
        ? native.brand.default
        : cell.isToday
          ? native.brand.subtle
          : "transparent",
    }),
    [cell.isToday, selected, native],
  );

  const dayTone = selected
    ? "inverse"
    : cell.isToday
      ? "brand"
      : isSunday
        ? "alert"
        : "default";

  return (
    <Button
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}`}
      accessibilityState={{ selected }}
      nestedScroll
      onPress={() => {
        const alreadySelected = useHighlightContext
          ? highlightDayKey === cell.dayKey
          : useCalendarSelectionStore.getState().selectedDayKey === cell.dayKey;
        onDayPress?.(cell.dayKey, alreadySelected);
        selectCalendarDay(cell.dayKey);
      }}
      ripple={false}
      size="none"
      style={{ flex: 1, minWidth: 0 }}
      tone="neutral"
      unstable_pressDelay={0}
      variant="ghost"
    >
      <View style={{ width: "100%", alignItems: "center" }}>
        <ThemedText
          align="center"
          tone={isSunday ? "alert" : "muted"}
          variant="label"
        >
          {weekdayLabel}
        </ThemedText>
        <View style={dayCircleStyle}>
          <ThemedText align="center" tone={dayTone} variant="label">
            {cell.date.day}
          </ThemedText>
        </View>
      </View>
    </Button>
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
  const native = useNativeColors();
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);
  const cells = useMemo(
    () => buildWeekCells(weekStartKey, focusMonthForWeek(weekStartKey)),
    [weekStartKey],
  );

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      width: "100%" as const,
      alignSelf: "stretch" as const,
      flexGrow: 0,
      flexShrink: 0,
      zIndex: 1,
      paddingBottom: semantic.space.stack.compact,
      backgroundColor: native.surface.default,
    }),
    [native],
  );

  return (
    <View style={rootStyle} onLayout={onLayout}>
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
