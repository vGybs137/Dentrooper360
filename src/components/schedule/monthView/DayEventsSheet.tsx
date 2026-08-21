import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatDayKeyLabel, type DayKey } from "@/utils/calendar";

import { MONTH_VIEW_SHEET_SNAP_INSTANT } from "@/constants/schedule";
import type { DayEventsSheetHandle, MonthDayEventPreview } from "@/types/schedule";

import { DayEventListItem } from "./DayEventListItem";

export type { DayEventsSheetHandle };

export type DayEventsSheetProps = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  /** Open height in px — fills space below the pinned week. */
  snapHeight: number;
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  /** Called after the sheet settles open/closed (not mid-drag). */
  onOpenChange?: (open: boolean) => void;
};

type BottomSheetRef = ComponentRef<typeof BottomSheet>;

const DayEventsSheetInner = forwardRef<
  DayEventsSheetHandle,
  DayEventsSheetProps
>(function DayEventsSheetInner(
  { dayKey, events, snapHeight, animatedIndex, animatedPosition, onOpenChange },
  ref,
) {
  const theme = useThemeTokens();
  const sheetRef = useRef<BottomSheetRef>(null);
  const snapHeightRef = useRef(snapHeight);
  snapHeightRef.current = snapHeight;
  const snapPoints = useMemo(() => [snapHeight], [snapHeight]);
  const [sheetIndex, setSheetIndex] = useState(-1);

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setSheetIndex(0);
      },
      close: () => {
        setSheetIndex(-1);
      },
      setHeight: (height: number) => {
        const capped = Math.max(0, Math.min(height, snapHeightRef.current));
        sheetRef.current?.snapToPosition(capped, MONTH_VIEW_SHEET_SNAP_INSTANT);
      },
    }),
    [],
  );

  const handleChange = useCallback(
    (index: number) => {
      setSheetIndex(index);
      onOpenChange?.(index >= 0);
    },
    [onOpenChange],
  );

  const renderItem = useCallback(
    ({ item }: { item: MonthDayEventPreview }) => (
      <DayEventListItem event={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: MonthDayEventPreview) => item.id, []);

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.foreground.muted,
    }),
    [theme],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.surface.default,
      borderTopLeftRadius: theme.semantic.radius.card,
      borderTopRightRadius: theme.semantic.radius.card,
    }),
    [theme],
  );

  const sheetStyle = useMemo(
    () => ({
      zIndex: theme.semantic.zIndex.raised,
    }),
    [theme],
  );

  const listContentStyle = useMemo(
    () => ({
      paddingTop: theme.semantic.space.stack.compact,
      paddingBottom: theme.semantic.space.section,
      gap: theme.semantic.space.gap.compact,
    }),
    [theme],
  );

  const ListHeader = useMemo(
    () => (
      <View
        className="px-page pb-stack pt-stack-compact"
        style={{
          borderBottomWidth: theme.semantic.borderWidth.subtle,
          borderBottomColor: theme.palette.border.subtle,
        }}
      >
        <ThemedText variant="title">{formatDayKeyLabel(dayKey)}</ThemedText>
        <ThemedText tone="muted" variant="label">
          {events.length === 0
            ? "No appointments"
            : `${events.length} appointment${events.length === 1 ? "" : "s"}`}
        </ThemedText>
      </View>
    ),
    [dayKey, events.length, theme],
  );

  const ListEmpty = useMemo(
    () => (
      <View className="px-page py-section">
        <ThemedText align="center" tone="muted">
          No appointments on this day.
        </ThemedText>
      </View>
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={sheetIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      onChange={handleChange}
      activeOffsetY={[-1, 1]}
      failOffsetX={[-theme.semantic.space.inline.compact, theme.semantic.space.inline.compact]}
      handleIndicatorStyle={handleIndicatorStyle}
      backgroundStyle={backgroundStyle}
      style={sheetStyle}
    >
      <BottomSheetFlatList
        data={events}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={listContentStyle}
      />
    </BottomSheet>
  );
});

export const DayEventsSheet = memo(DayEventsSheetInner);
