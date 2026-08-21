import { memo, useMemo } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ui";
import {
  selectCalendarDay,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
import type { DayCellModel } from "@/utils/calendar";

import { DayEventChip, DayEventDot } from "./DayEventChip";
import {
  SHEET_OPEN_CONTENT_SCALE,
  SHEET_OPEN_HOST_SCALE_Y,
  usePagerShrinkIndex,
} from "./PagerShrinkContext";
import type { MonthDayEventPreview } from "./types";

export type DayCellProps = {
  cell: DayCellModel;
  width: number;
  height: number;
  columnIndex: number;
  rowIndex: number;
  events?: MonthDayEventPreview[];
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
  style,
}: DayCellProps) {
  const theme = useThemeTokens();
  const selected = useIsCalendarDaySelected(cell.dayKey);
  const muted = !cell.inCurrentMonth;
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const overflowCount = Math.max(0, events.length - visibleEvents.length);
  const shrinkIndex = usePagerShrinkIndex();

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

  // Counter host scaleY on the date badge so it stays circular when the sheet opens.
  const dayNumberCounterStyle = useAnimatedStyle(() => {
    const index = shrinkIndex?.value ?? -1;
    const hostScaleY = interpolate(
      index,
      [-1, 0],
      [1, SHEET_OPEN_HOST_SCALE_Y],
      Extrapolation.CLAMP,
    );
    const contentScale = interpolate(
      index,
      [-1, 0],
      [1, SHEET_OPEN_CONTENT_SCALE],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { scaleX: contentScale },
        { scaleY: hostScaleY > 0.001 ? contentScale / hostScaleY : 1 },
      ],
    };
  });

  // Undo host scaleY squash on event chips/dots.
  const contentCounterStyle = useAnimatedStyle(() => {
    const index = shrinkIndex?.value ?? -1;
    const hostScaleY = interpolate(
      index,
      [-1, 0],
      [1, SHEET_OPEN_HOST_SCALE_Y],
      Extrapolation.CLAMP,
    );
    const contentScale = interpolate(
      index,
      [-1, 0],
      [1, SHEET_OPEN_CONTENT_SCALE],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { scaleX: contentScale },
        { scaleY: hostScaleY > 0.001 ? contentScale / hostScaleY : 1 },
      ],
    };
  });

  const chipsStyle = useAnimatedStyle(() => {
    const index = shrinkIndex?.value ?? -1;
    const open = interpolate(
      index,
      [-1, -0.35, 0],
      [0, 0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: 1 - open };
  });

  const dotsStyle = useAnimatedStyle(() => {
    const index = shrinkIndex?.value ?? -1;
    const open = interpolate(
      index,
      [-1, -0.35, 0],
      [0, 0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: open };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}${
        events.length ? `, ${events.length} events` : ""
      }`}
      onPress={() => selectCalendarDay(cell.dayKey)}
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
      {/* Date badge: radius on inner view; transform on wrapper (Android). */}
      <View
        style={{
          alignItems: "center",
          marginBottom: 4,
          opacity: muted && !selected ? 0.4 : 1,
        }}
      >
        <Animated.View style={dayNumberCounterStyle}>
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
        </Animated.View>
      </View>

      <Animated.View
        style={[
          {
            flex: 1,
            transformOrigin: "top left",
          },
          contentCounterStyle,
        ]}
      >
        {visibleEvents.length > 0 ? (
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.View
              style={[{ flex: 1, gap: 2, overflow: "hidden" }, chipsStyle]}
              pointerEvents="none"
            >
              {visibleEvents.map((event) => (
                <DayEventChip key={event.id} event={event} />
              ))}
              {overflowCount > 0 ? (
                <ThemedText
                  tone="muted"
                  style={{ fontSize: 9, lineHeight: 11 }}
                >
                  +{overflowCount} more
                </ThemedText>
              ) : null}
            </Animated.View>

            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 2,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 3,
                },
                dotsStyle,
              ]}
              pointerEvents="none"
            >
              {visibleEvents.map((event) => (
                <DayEventDot key={event.id} color={event.color} />
              ))}
            </Animated.View>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export const DayCell = memo(DayCellComponent);
