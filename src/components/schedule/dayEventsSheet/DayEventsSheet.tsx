import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { DayHeaderLabel } from "@/components/schedule/DayHeaderLabel";
import { EmptyState } from "@/components/ui";
import { calendarIcon } from "@/constants";
import {
  parseDayKey,
  toLocalDate,
  type DayKey,
} from "@/helpers/schedule/calendar";
import { useAddAppointmentStore } from "@/stores";

import type {
  DayEventsSheetHandle,
  MonthDayEventPreview,
} from "@/types/schedule";

import { DayEventListItem } from "./DayEventListItem";

export type { DayEventsSheetHandle };

export type DayEventsSheetProps = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  /** Open height in px — fills space below the calendar chrome / day header. */
  snapHeight: number;
  /** Reanimated style from useDayEventsSheetProgress (translateY from openProgress). */
  sheetAnimatedStyle: object;
  /** pointerEvents from openProgress — clears hits as soon as the sheet is closed. */
  sheetAnimatedProps: object;
  beginDrag: () => void;
  applyDragTranslation: (translationY: number) => void;
  endDrag: (velocityY: number) => void;
  open: () => void;
  close: () => void;
};

const DayEventsSheetInner = forwardRef<
  DayEventsSheetHandle,
  DayEventsSheetProps
>(function DayEventsSheetInner(
  {
    dayKey,
    events,
    snapHeight,
    sheetAnimatedStyle,
    sheetAnimatedProps,
    beginDrag,
    applyDragTranslation,
    endDrag,
    open,
    close,
  },
  ref,
) {
  const native = useNativeColors();
  const selectSlot = useAddAppointmentStore((state) => state.selectSlot);
  const openAddAppointment = useAddAppointmentStore((state) => state.open);
  const scrollOffsetSV = useSharedValue(0);
  const dismissDragSV = useSharedValue(false);
  const touchStartYSV = useSharedValue(0);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [close, open],
  );

  const renderItem = useCallback<ListRenderItem<MonthDayEventPreview>>(
    ({ item }) => <DayEventListItem event={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: MonthDayEventPreview) => item.id,
    [],
  );

  const listContentStyle = useMemo(
    () => ({
      flexGrow: events.length === 0 ? 1 : undefined,
      paddingBottom: semantic.space.section,
    }),
    [events.length],
  );

  const rootStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: snapHeight,
      // No elevation/zIndex — raised stacking escapes overflow clips on Android
      // and let the closed sheet paint under Quick Add.
      backgroundColor: native.surface.default,
      borderTopLeftRadius: semantic.radius.card,
      borderTopRightRadius: semantic.radius.card,
      overflow: "hidden" as const,
    }),
    [snapHeight, native],
  );

  const handleStyle = useMemo(
    () => ({
      alignItems: "center" as const,
      paddingTop: semantic.space.stack.compact,
      paddingBottom: semantic.space.stack.compact,
    }),
    [],
  );

  const handlePillStyle = useMemo(
    () => ({
      width: primitives.space[24] + primitives.space[12],
      height: primitives.space[4],
      borderRadius: primitives.radius.full,
      backgroundColor: native.foreground.muted,
    }),
    [native],
  );

  const headerStyle = useMemo(
    () => ({
      backgroundColor: native.surface.default,
      borderBottomWidth: semantic.borderWidth.subtle,
      borderBottomColor: native.border.subtle,
    }),
    [native],
  );

  const handleAddAppointment = useCallback(() => {
    const dayStart = toLocalDate(parseDayKey(dayKey));
    dayStart.setHours(9, 0, 0, 0);
    selectSlot(dayStart);
    openAddAppointment();
  }, [dayKey, openAddAppointment, selectSlot]);

  const ListEmpty = useMemo(
    () => (
      <EmptyState
        action={{
          label: "Add appointment",
          onPress: handleAddAppointment,
        }}
        className="py-stack"
        icon={calendarIcon}
        title="No appointments"
      />
    ),
    [handleAddAppointment],
  );

  const ItemSeparator = useCallback(
    () => (
      <View
        className="mx-page"
        style={{
          height: semantic.borderWidth.subtle,
          backgroundColor: native.border.subtle,
        }}
      />
    ),
    [native],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetSV.value = event.nativeEvent.contentOffset.y;
    },
    [scrollOffsetSV],
  );

  const failOffsetX = useMemo(
    () =>
      [
        -semantic.space.inline.compact,
        semantic.space.inline.compact,
      ] as [number, number],
    [],
  );

  /** Handle + day header — always dismisses (no scroll competition). */
  const chromePan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(4)
        .failOffsetX(failOffsetX)
        .onBegin(() => {
          beginDrag();
        })
        .onUpdate((event) => {
          applyDragTranslation(event.translationY);
        })
        .onEnd((event) => {
          endDrag(event.velocityY);
        }),
    [applyDragTranslation, beginDrag, endDrag, failOffsetX],
  );

  /**
   * List: activate dismiss only when scrolled to top and pulling down;
   * otherwise fail so the native scroll gesture owns the touch.
   */
  const contentPan = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .failOffsetX(failOffsetX)
        .onTouchesDown((event) => {
          touchStartYSV.value = event.allTouches[0]?.absoluteY ?? 0;
        })
        .onTouchesMove((event, state) => {
          const y = event.allTouches[0]?.absoluteY ?? touchStartYSV.value;
          const dy = y - touchStartYSV.value;

          if (scrollOffsetSV.value > 1) {
            state.fail();
            return;
          }
          if (dy < -8) {
            // Pulling up — let the list scroll.
            state.fail();
            return;
          }
          if (dy > 8) {
            state.activate();
          }
        })
        .onBegin(() => {
          dismissDragSV.value = true;
          beginDrag();
        })
        .onUpdate((event) => {
          if (event.translationY > 0) {
            applyDragTranslation(event.translationY);
          }
        })
        .onEnd((event) => {
          if (dismissDragSV.value) {
            endDrag(event.velocityY);
          }
          dismissDragSV.value = false;
        })
        .onFinalize(() => {
          dismissDragSV.value = false;
        }),
    [
      applyDragTranslation,
      beginDrag,
      dismissDragSV,
      endDrag,
      failOffsetX,
      scrollOffsetSV,
      touchStartYSV,
    ],
  );

  const nativeScroll = useMemo(() => Gesture.Native(), []);

  const listGesture = useMemo(
    () => Gesture.Simultaneous(contentPan, nativeScroll),
    [contentPan, nativeScroll],
  );

  if (snapHeight <= 0) return null;

  return (
    <Animated.View
      style={[rootStyle, sheetAnimatedStyle as StyleProp<ViewStyle>]}
      animatedProps={sheetAnimatedProps as never}
    >
      <GestureDetector gesture={chromePan}>
        <View>
          <View style={handleStyle} accessibilityRole="adjustable">
            <View style={handlePillStyle} />
          </View>
          <View className="px-page pb-stack pt-stack-compact" style={headerStyle}>
            <DayHeaderLabel dayKey={dayKey} weekdayFormat="short" />
          </View>
        </View>
      </GestureDetector>

      <GestureDetector gesture={listGesture}>
        <Animated.View style={{ flex: 1 }}>
          <FlatList
            data={events}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={ItemSeparator}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={listContentStyle}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces
            overScrollMode="never"
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

export const DayEventsSheet = memo(DayEventsSheetInner);
