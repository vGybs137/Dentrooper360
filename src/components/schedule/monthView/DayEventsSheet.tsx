import BottomSheet, {
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, type Ref } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatDayKeyLabel, type DayKey } from "@/utils/calendar";

import { DayEventListItem } from "./DayEventListItem";
import type { MonthDayEventPreview } from "./types";

export type DayEventsSheetProps = {
  selectedDayKey: DayKey;
  events: MonthDayEventPreview[];
  /** -1 closed, 0 open at 45% */
  index: number;
  onChange: (index: number) => void;
  /** Sync React index when an animation target is chosen (avoids close flicker). */
  onAnimate?: (fromIndex: number, toIndex: number) => void;
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  sheetRef?: Ref<BottomSheet>;
  style?: StyleProp<ViewStyle>;
};

const SNAP_POINTS = ["45%"];

export function DayEventsSheet({
  selectedDayKey,
  events,
  index,
  onChange,
  onAnimate,
  animatedIndex,
  animatedPosition,
  sheetRef,
  style,
}: DayEventsSheetProps) {
  const theme = useThemeTokens();
  const dayLabel = useMemo(
    () => formatDayKeyLabel(selectedDayKey),
    [selectedDayKey],
  );

  const renderItem = useCallback(
    ({ item }: { item: MonthDayEventPreview }) => (
      <DayEventListItem event={item} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: MonthDayEventPreview) => item.id,
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={index}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      enableDynamicSizing={false}
      animateOnMount={false}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      onChange={onChange}
      onAnimate={onAnimate}
      backgroundStyle={{
        backgroundColor: theme.palette.surface.raised,
        borderTopLeftRadius: theme.semantic.radius.dialog,
        borderTopRightRadius: theme.semantic.radius.dialog,
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.palette.border.strong,
        width: 40,
      }}
      style={style}
    >
      <View
        style={{
          paddingHorizontal: theme.semantic.space.inline.compact,
          paddingBottom: theme.semantic.space.stack.compact,
          borderBottomWidth: theme.semantic.borderWidth.subtle,
          borderBottomColor: theme.palette.border.subtle,
        }}
      >
        <ThemedText variant="title">{dayLabel}</ThemedText>
        <ThemedText tone="muted" variant="label">
          {events.length === 0
            ? "No appointments"
            : `${events.length} appointment${events.length === 1 ? "" : "s"}`}
        </ThemedText>
      </View>

      {events.length === 0 ? (
        <View
          style={{
            padding: theme.semantic.space.section,
            alignItems: "center",
          }}
        >
          <ThemedText tone="muted">No appointments</ThemedText>
        </View>
      ) : (
        <BottomSheetFlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: theme.semantic.space.section,
          }}
        />
      )}
    </BottomSheet>
  );
}
