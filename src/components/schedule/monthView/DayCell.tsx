import { memo, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { Button, ThemedText } from "@/components/ui";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
  useIsCalendarDaySelected,
} from "@/stores/calendarSelectionStore";
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
  const chipRowHeight =
    semantic.space.stack.comfortable + primitives.space[2];
  const overflowRowHeight = 11 + primitives.space[2];

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
      chipsGapStyle: { gap: primitives.space[2] },
    };
  }, [availableHeight, chipRowHeight, events, overflowRowHeight]);
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
  const native = useNativeColors();
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
        ? native.brand.default
        : cell.isToday
          ? native.brand.subtle
          : "transparent",
    }),
    [cell.isToday, selected, native],
  );

  const cellHeight = rowIndex < 5 ? height - MONTH_VIEW_CELL_GAP : height;
  const cellStyle = useMemo(
    () => ({
      width: columnIndex < 6 ? width - MONTH_VIEW_CELL_GAP : width,
      height: cellHeight,
      marginRight: columnIndex < 6 ? MONTH_VIEW_CELL_GAP : 0,
      marginBottom: rowIndex < 5 ? MONTH_VIEW_CELL_GAP : 0,
      paddingHorizontal: semantic.space.stack.compact,
      paddingTop: semantic.space.stack.compact,
      paddingBottom: primitives.space[2],
      borderRadius: semantic.radius.control,
      borderWidth: semantic.borderWidth.strong,
      borderColor: selected ? native.brand.subtle : "transparent",
      backgroundColor: muted
        ? native.calendar.muted
        : native.calendar.default,
    }),
    [cellHeight, columnIndex, muted, rowIndex, selected, native, width],
  );

  const eventsAvailableHeight = Math.max(
    0,
    cellHeight -
      semantic.space.stack.compact -
      primitives.space[2] -
      MONTH_VIEW_DAY_NUMBER_SIZE -
      semantic.space.stack.compact,
  );

  const headerStyle = useMemo(
    () => ({
      marginBottom: semantic.space.stack.compact,
      opacity: muted && !selected ? MONTH_VIEW_MUTED_DAY_OPACITY : 1,
    }),
    [muted, selected],
  );

  const dayTextStyle = useMemo(
    () => ({
      fontVariant: ["tabular-nums"] as "tabular-nums"[],
      fontSize: primitives.fontSize.sm,
    }),
    [],
  );

  const showEvents = events.length > 0 && eventIndicators !== "none";

  return (
    <Button
      accessibilityLabel={`${cell.dayKey}${cell.isToday ? ", today" : ""}${
        events.length ? `, ${events.length} events` : ""
      }`}
      accessibilityState={{ selected }}
      nestedScroll
      onPress={() => {
        const alreadySelected =
          useCalendarSelectionStore.getState().selectedDayKey === cell.dayKey;
        // Navigate (pager setPage) before store updates so the scroll starts
        // before selection re-renders the grid.
        onDayPress?.(cell.dayKey, alreadySelected);
        selectCalendarDay(cell.dayKey);
      }}
      ripple={false}
      size="none"
      style={({ pressed }) => [
        cellStyle,
        style,
        pressed && !selected ? { opacity: 0.72 } : null,
      ]}
      tone="neutral"
      variant="ghost"
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
    </Button>
  );
}

export const DayCell = memo(DayCellComponent);
