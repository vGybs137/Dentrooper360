import { memo, useMemo } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/ui";
import {
  selectCalendarDay,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
import type { DayCellModel } from "@/utils/calendar";
import { weekdayIndex } from "@/utils/calendar";

import { DayEventChip } from "./DayEventChip";
import type { MonthDayEventPreview } from "./types";

export type DayCellProps = {
  cell: DayCellModel;
  width: number;
  height: number;
  columnIndex: number;
  rowIndex: number;
  events?: MonthDayEventPreview[];
  onDayPress?: (dayKey: DayCellModel["dayKey"]) => void;
  style?: StyleProp<ViewStyle>;
};

const MAX_VISIBLE_EVENTS = 3;
const CELL_GAP = 3;

function DayCellComponent({
  cell,
  width,
  height,
  columnIndex,
  rowIndex,
  events = [],
  onDayPress,
  style,
}: DayCellProps) {
  const theme = useThemeTokens();
  const selected = useIsCalendarDaySelected(cell.dayKey);
  const muted = !cell.inCurrentMonth;
  const isSunday = weekdayIndex(cell.date) === 0;
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const overflowCount = Math.max(0, events.length - visibleEvents.length);

  const dayNumberStyle = useMemo(
    () => ({
      width: 24,
      height: 24,
      borderRadius: 12,
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}${
        events.length ? `, ${events.length} events` : ""
      }`}
      onPress={() => {
        selectCalendarDay(cell.dayKey);
        onDayPress?.(cell.dayKey);
      }}
      style={[
        {
          width: columnIndex < 6 ? width - CELL_GAP : width,
          height: rowIndex < 5 ? height - CELL_GAP : height,
          marginRight: columnIndex < 6 ? CELL_GAP : 0,
          marginBottom: rowIndex < 5 ? CELL_GAP : 0,
          paddingHorizontal: 3,
          paddingTop: 4,
          paddingBottom: 2,
          borderRadius: theme.semantic.radius.control,
          borderWidth: 2,
          borderColor: selected ? theme.palette.brand.subtle : "transparent",
          backgroundColor: muted
            ? theme.palette.calendar.muted
            : theme.palette.calendar.default,
        },
        style,
      ]}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 4,
          opacity: muted && !selected ? 0.4 : 1,
        }}
      >
        <View style={dayNumberStyle}>
          <ThemedText
            align="center"
            tone={
              selected
                ? "inverse"
                : isSunday
                  ? "alert"
                  : muted
                    ? "muted"
                    : cell.isToday
                      ? "brand"
                      : "default"
            }
            variant="label"
            style={{ fontVariant: ["tabular-nums"], fontSize: 12 }}
          >
            {cell.date.day}
          </ThemedText>
        </View>
      </View>

      <View style={{ flex: 1, gap: 2, overflow: "hidden" }}>
        {visibleEvents.map((event) => (
          <DayEventChip key={event.id} event={event} />
        ))}
        {overflowCount > 0 ? (
          <ThemedText tone="muted" style={{ fontSize: 9, lineHeight: 11 }}>
            +{overflowCount} more
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

export const DayCell = memo(DayCellComponent);
