import { memo, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ui";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
import type { DayCellModel } from "@/utils/calendar";
import { weekdayIndex } from "@/utils/calendar";

import {
  MONTH_VIEW_CELL_GAP,
  MONTH_VIEW_CHIP_FADE_END,
  MONTH_VIEW_DAY_NUMBER_SIZE,
  MONTH_VIEW_DOT_FADE_END,
  MONTH_VIEW_DOT_FADE_START,
  MONTH_VIEW_MAX_VISIBLE_EVENTS,
  MONTH_VIEW_MUTED_DAY_OPACITY,
} from "@/constants/schedule";
import type { DayPressHandler, MonthDayEventPreview } from "@/types/schedule";

import { DayEventChip } from "./DayEventChip";
import { DayEventDots } from "./DayEventDots";
import { useSheetOpenProgress } from "@/contexts/SheetOpenProgressContext";

/** How event indicators render inside a day cell. */
export type DayCellEventIndicators =
  | "crossfade"
  | "chips"
  | "dots"
  | "none";

export type DayCellProps = {
  cell: DayCellModel;
  width: number;
  height: number;
  columnIndex: number;
  rowIndex: number;
  events?: MonthDayEventPreview[];
  /** Default `crossfade` — chip↔dot progress worklets. Prefer static modes when settled. */
  eventIndicators?: DayCellEventIndicators;
  onDayPress?: DayPressHandler;
  style?: StyleProp<ViewStyle>;
};

function useVisibleChips(
  events: MonthDayEventPreview[],
  availableHeight: number,
) {
  const theme = useThemeTokens();
  const chipRowHeight =
    theme.semantic.space.stack.comfortable + theme.primitives.space[2];
  const overflowRowHeight = 11 + theme.primitives.space[2];

  return useMemo(() => {
    const maxBySpace = Math.max(
      0,
      Math.floor(availableHeight / Math.max(chipRowHeight, 1)),
    );
    let visibleCount = Math.min(
      MONTH_VIEW_MAX_VISIBLE_EVENTS,
      maxBySpace,
      events.length,
    );

    if (events.length > visibleCount) {
      const maxWithOverflow = Math.max(
        0,
        Math.floor(
          (availableHeight - overflowRowHeight) / Math.max(chipRowHeight, 1),
        ),
      );
      visibleCount = Math.min(
        MONTH_VIEW_MAX_VISIBLE_EVENTS,
        maxWithOverflow,
        Math.max(0, events.length - 1),
      );
    }

    const visible = events.slice(0, visibleCount);
    return {
      visibleEvents: visible,
      overflowCount: Math.max(0, events.length - visible.length),
      chipsGapStyle: { gap: theme.primitives.space[2] },
    };
  }, [availableHeight, chipRowHeight, events, overflowRowHeight, theme]);
}

function DayCellChips({
  events,
  availableHeight,
}: {
  events: MonthDayEventPreview[];
  availableHeight: number;
}) {
  const { visibleEvents, overflowCount, chipsGapStyle } = useVisibleChips(
    events,
    availableHeight,
  );

  return (
    <View style={[{ flex: 1, overflow: "hidden" }, chipsGapStyle]}>
      {visibleEvents.map((event) => (
        <DayEventChip key={event.id} event={event} />
      ))}
      {overflowCount > 0 ? (
        <ThemedText
          tone="muted"
          numberOfLines={1}
          style={{ fontSize: 9, lineHeight: 11 }}
        >
          +{overflowCount} more
        </ThemedText>
      ) : null}
    </View>
  );
}

const DayCellChipsMemo = memo(DayCellChips);

function DayCellDotsOnly({ events }: { events: MonthDayEventPreview[] }) {
  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <DayEventDots events={events} />
    </View>
  );
}

const DayCellDotsOnlyMemo = memo(DayCellDotsOnly);

function DayCellEventsCrossfade({
  events,
  availableHeight,
}: {
  events: MonthDayEventPreview[];
  availableHeight: number;
}) {
  const openProgress = useSheetOpenProgress();
  const { visibleEvents, overflowCount, chipsGapStyle } = useVisibleChips(
    events,
    availableHeight,
  );

  const chipsStyle = useAnimatedStyle(() => {
    const p = openProgress?.value ?? 0;
    return {
      opacity: interpolate(
        p,
        [0, MONTH_VIEW_CHIP_FADE_END],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const dotsStyle = useAnimatedStyle(() => {
    const p = openProgress?.value ?? 0;
    return {
      opacity: interpolate(
        p,
        [MONTH_VIEW_DOT_FADE_START, MONTH_VIEW_DOT_FADE_END],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <Animated.View style={[chipsGapStyle, chipsStyle]}>
        {visibleEvents.map((event) => (
          <DayEventChip key={event.id} event={event} />
        ))}
        {overflowCount > 0 ? (
          <ThemedText
            tone="muted"
            numberOfLines={1}
            style={{ fontSize: 9, lineHeight: 11 }}
          >
            +{overflowCount} more
          </ThemedText>
        ) : null}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", left: 0, right: 0, top: 0 }, dotsStyle]}
      >
        <DayEventDots events={events} />
      </Animated.View>
    </View>
  );
}

const DayCellEventsCrossfadeMemo = memo(DayCellEventsCrossfade);

function DayCellComponent({
  cell,
  width,
  height,
  columnIndex,
  rowIndex,
  events = [],
  eventIndicators = "crossfade",
  onDayPress,
  style,
}: DayCellProps) {
  const theme = useThemeTokens();
  const selected = useIsCalendarDaySelected(cell.dayKey);
  const muted = !cell.inCurrentMonth;
  const isSunday = weekdayIndex(cell.date) === 0;

  const dayNumberStyle = useMemo(
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

  const cellHeight = rowIndex < 5 ? height - MONTH_VIEW_CELL_GAP : height;
  const cellStyle = useMemo(
    () => ({
      width: columnIndex < 6 ? width - MONTH_VIEW_CELL_GAP : width,
      height: cellHeight,
      marginRight: columnIndex < 6 ? MONTH_VIEW_CELL_GAP : 0,
      marginBottom: rowIndex < 5 ? MONTH_VIEW_CELL_GAP : 0,
      paddingHorizontal: theme.semantic.space.stack.compact,
      paddingTop: theme.semantic.space.stack.compact,
      paddingBottom: theme.primitives.space[2],
      borderRadius: theme.semantic.radius.control,
      borderWidth: theme.semantic.borderWidth.strong,
      borderColor: selected ? theme.palette.brand.subtle : "transparent",
      backgroundColor: muted
        ? theme.palette.calendar.muted
        : theme.palette.calendar.default,
    }),
    [cellHeight, columnIndex, muted, rowIndex, selected, theme, width],
  );

  const eventsAvailableHeight = Math.max(
    0,
    cellHeight -
      theme.semantic.space.stack.compact -
      theme.primitives.space[2] -
      MONTH_VIEW_DAY_NUMBER_SIZE -
      theme.semantic.space.stack.compact,
  );

  const headerStyle = useMemo(
    () => ({
      marginBottom: theme.semantic.space.stack.compact,
      opacity: muted && !selected ? MONTH_VIEW_MUTED_DAY_OPACITY : 1,
    }),
    [muted, selected, theme],
  );

  const dayTextStyle = useMemo(
    () => ({
      fontVariant: ["tabular-nums"] as "tabular-nums"[],
      fontSize: theme.primitives.fontSize.sm,
    }),
    [theme],
  );

  const showEvents = events.length > 0 && eventIndicators !== "none";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}${
        events.length ? `, ${events.length} events` : ""
      }`}
      onPress={() => {
        const alreadySelected =
          useCalendarSelectionStore.getState().selectedDayKey === cell.dayKey;
        // Navigate (pager setPage) before store updates so the scroll starts
        // before selection re-renders the grid.
        onDayPress?.(cell.dayKey, alreadySelected);
        selectCalendarDay(cell.dayKey);
      }}
      style={({ pressed }) => [
        cellStyle,
        style,
        pressed && !selected ? { opacity: 0.72 } : null,
      ]}
    >
      <View className="items-center" style={headerStyle}>
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
            style={dayTextStyle}
          >
            {cell.date.day}
          </ThemedText>
        </View>
      </View>

      {showEvents && eventIndicators === "crossfade" ? (
        <DayCellEventsCrossfadeMemo
          events={events}
          availableHeight={eventsAvailableHeight}
        />
      ) : null}
      {showEvents && eventIndicators === "chips" ? (
        <DayCellChipsMemo
          events={events}
          availableHeight={eventsAvailableHeight}
        />
      ) : null}
      {showEvents && eventIndicators === "dots" ? (
        <DayCellDotsOnlyMemo events={events} />
      ) : null}
    </Pressable>
  );
}

export const DayCell = memo(DayCellComponent);
