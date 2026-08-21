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

import { DayEventListItem } from "./DayEventListItem";
import type { MonthDayEventPreview } from "./types";

export type DayEventsSheetHandle = {
  open: () => void;
  close: () => void;
  /** Finger-follow: set visible sheet height in px (no settle animation). */
  setHeight: (height: number) => void;
};

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

const INSTANT = { duration: 0 } as const;

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
  // Controlled index synced only via open/close + onChange (settle) — never mid-pan elsewhere.
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
        sheetRef.current?.snapToPosition(capped, INSTANT);
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

  const ListHeader = (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
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
  );

  const ListEmpty = (
    <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
      <ThemedText align="center" tone="muted">
        No appointments on this day.
      </ThemedText>
    </View>
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
      failOffsetX={[-12, 12]}
      handleIndicatorStyle={{
        backgroundColor: theme.palette.foreground.muted,
      }}
      backgroundStyle={{
        backgroundColor: theme.palette.surface.default,
        borderTopLeftRadius: theme.semantic.radius.card,
        borderTopRightRadius: theme.semantic.radius.card,
      }}
      style={{
        zIndex: 10,
      }}
    >
      <BottomSheetFlatList
        data={events}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: 24,
          gap: 4,
        }}
      />
    </BottomSheet>
  );
});

export const DayEventsSheet = memo(DayEventsSheetInner);
