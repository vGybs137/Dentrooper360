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

import { DayHeaderLabel } from "@/components/schedule/DayHeaderLabel";
import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import type { DayKey } from "@/utils/calendar";

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
  const theme = useThemeTokens();
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
      paddingBottom: theme.semantic.space.section,
    }),
    [theme],
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
      backgroundColor: theme.palette.surface.default,
      borderTopLeftRadius: theme.semantic.radius.card,
      borderTopRightRadius: theme.semantic.radius.card,
      overflow: "hidden" as const,
    }),
    [snapHeight, theme],
  );

  const handleStyle = useMemo(
    () => ({
      alignItems: "center" as const,
      paddingTop: theme.semantic.space.stack.compact,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const handlePillStyle = useMemo(
    () => ({
      width: theme.primitives.space[24] + theme.primitives.space[12],
      height: theme.primitives.space[4],
      borderRadius: theme.primitives.radius.full,
      backgroundColor: theme.palette.foreground.muted,
    }),
    [theme],
  );

  const headerStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.surface.default,
      borderBottomWidth: theme.semantic.borderWidth.subtle,
      borderBottomColor: theme.palette.border.subtle,
    }),
    [theme],
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

  const ItemSeparator = useCallback(
    () => (
      <View
        className="mx-page"
        style={{
          height: theme.semantic.borderWidth.subtle,
          backgroundColor: theme.palette.border.subtle,
        }}
      />
    ),
    [theme],
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
        -theme.semantic.space.inline.compact,
        theme.semantic.space.inline.compact,
      ] as [number, number],
    [theme],
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
