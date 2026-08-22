import { memo, useMemo } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui";
import { weekdayLabels } from "@/helpers/weekdayLabels";
import {
  selectCalendarDay,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
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
};

type WeekDayHeaderCellProps = {
  cell: DayCellModel;
  weekdayLabel: string;
};

function WeekDayHeaderCell({ cell, weekdayLabel }: WeekDayHeaderCellProps) {
  const theme = useThemeTokens();
  const selected = useIsCalendarDaySelected(cell.dayKey);
  const isSunday = weekdayIndex(cell.date) === 0;

  const dayCircleStyle = useMemo(
    () => ({
      width: theme.primitives.space[24],
      height: theme.primitives.space[24],
      borderRadius: theme.semantic.radius.pill,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: selected ? theme.palette.brand.default : "transparent",
    }),
    [selected, theme],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-1 items-center"
      onPress={() => selectCalendarDay(cell.dayKey)}
    >
      <ThemedText tone={isSunday ? "alert" : "muted"} variant="label">
        {weekdayLabel}
      </ThemedText>
      <View style={dayCircleStyle}>
        <ThemedText
          tone={selected ? "inverse" : cell.isToday ? "brand" : "default"}
          variant="label"
        >
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
    <View className="w-full self-stretch" style={rootStyle}>
      <View style={{ width: gutterWidth }} />
      {cells.map((cell, index) => (
        <WeekDayHeaderCell
          key={cell.dayKey}
          cell={cell}
          weekdayLabel={labels[index] ?? ""}
        />
      ))}
    </View>
  );
}

export const WeekDayHeaderRow = memo(WeekDayHeaderRowComponent);
