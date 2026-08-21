import React, { useMemo } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import type { DayCellModel, DayKey } from "@/utils/calendar";

import { DayEventChip } from "./DayEventChip";
import type { MonthDayEventPreview } from "./types";

export type DayCellProps = {
  cell: DayCellModel;
  width: number;
  height: number;
  columnIndex: number;
  rowIndex: number;
  events?: MonthDayEventPreview[];
  selected?: boolean;
  onPress?: (dayKey: DayKey) => void;
  style?: StyleProp<ViewStyle>;
};

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({
  cell,
  width,
  height,
  columnIndex,
  rowIndex,
  events = [],
  selected = false,
  onPress,
  style,
}: DayCellProps) {
  const theme = useThemeTokens();
  const muted = !cell.inCurrentMonth;
  const borderColor = theme.palette.border.default;
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const overflowCount = Math.max(0, events.length - visibleEvents.length);

  const dayNumberStyle = useMemo(
    () => ({
      minWidth: 22,
      height: 22,
      paddingHorizontal: 4,
      borderRadius: theme.semantic.radius.pill,
      alignItems: "center" as const,
      justifyContent: "center" as const,
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
      disabled={!onPress}
      onPress={() => onPress?.(cell.dayKey)}
      style={[
        {
          width,
          height,
          paddingHorizontal: 3,
          paddingTop: 4,
          paddingBottom: 2,
          backgroundColor: selected
            ? theme.palette.brand.subtle
            : muted
              ? theme.palette.surface.sunken
              : theme.palette.surface.default,
          borderColor,
          borderRightWidth: columnIndex < 6 ? 1 : 0,
          borderBottomWidth: rowIndex < 5 ? 1 : 0,
        },
        style,
      ]}
    >
      <View style={{ alignItems: "flex-start", marginBottom: 2 }}>
        <View style={dayNumberStyle}>
          <ThemedText
            align="center"
            tone={
              selected
                ? "inverse"
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
