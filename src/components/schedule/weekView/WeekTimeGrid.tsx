import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { ScrollView as ScrollViewType } from "react-native-gesture-handler";

import {
  buildHalfHourLineTops,
  buildHourLineTops,
  layoutDayColumnEvents,
  localMinutesFromMidnight,
  nowLineYForMinutes,
  TimedGridOverflowChip,
  TimedGridNowIndicator,
  TimedGridSlotLayer,
} from "@/components/schedule/timedGrid";
import {
  WEEK_VIEW_GUTTER_WIDTH,
  WEEK_VIEW_GRID_EDGE_INSET,
  WEEK_VIEW_HOUR_GAP,
  WEEK_VIEW_HOUR_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
  WEEK_VIEW_SCROLL_PADDING_MINUTES,
} from "@/constants/schedule";
import { withOpacity } from "@/helpers/ui/color";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import type { WeekEventsByDay } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import {
  addDays,
  gridHeightForHourRange,
  isMinuteInWorkingWindow,
  MINUTES_PER_HOUR,
  minutesToY,
  minutesToYInWorkingWindow,
  parseDayKey,
  sameDay,
  todayCalendarDate,
  toDayKey,
  WEEK_DAYS,
  type DayKey,
} from "@/helpers/schedule/calendar";

import { TimeGutter } from "./TimeGutter";
import { WeekEventBlock } from "./WeekEventBlock";

export type WeekTimeGridProps = {
  weekStartKey: DayKey;
  eventsByDay?: WeekEventsByDay;
  hourHeight?: number;
  hourGap?: number;
  gutterWidth?: number;
  /** When true, scroll to the current local time on mount (today's week only). */
  scrollToNowOnMount?: boolean;
  /** Draw a horizontal line at the current local time in today's column. */
  showNowIndicator?: boolean;
  onVerticalScrollBegin?: () => void;
  onVerticalScrollEnd?: () => void;
};

function todayColumnIndexForWeek(weekStartKey: DayKey): number {
  const today = todayCalendarDate();
  const start = parseDayKey(weekStartKey);
  for (let columnIndex = 0; columnIndex < WEEK_DAYS; columnIndex++) {
    if (sameDay(addDays(start, columnIndex), today)) {
      return columnIndex;
    }
  }
  return -1;
}

function WeekTimeGridComponent({
  weekStartKey,
  eventsByDay = {},
  hourHeight = WEEK_VIEW_HOUR_HEIGHT,
  hourGap = WEEK_VIEW_HOUR_GAP,
  gutterWidth = WEEK_VIEW_GUTTER_WIDTH,
  scrollToNowOnMount = true,
  showNowIndicator = true,
  onVerticalScrollBegin,
  onVerticalScrollEnd,
}: WeekTimeGridProps) {
  const native = useNativeColors();
  const { envelope, hoursForDayKey } = useUserScheduleHours();
  const { startHour: gridStartHour, endHour: gridEndHour } = envelope;
  const scrollRef = useRef<ScrollViewType>(null);
  const hasScrolledRef = useRef(false);
  const todayColumnIndex = useMemo(
    () => todayColumnIndexForWeek(weekStartKey),
    [weekStartKey],
  );
  const [nowMinutes, setNowMinutes] = useState(() =>
    localMinutesFromMidnight(new Date()),
  );

  const todayDayKey = useMemo(() => {
    if (todayColumnIndex < 0) {
      return null;
    }
    return toDayKey(addDays(parseDayKey(weekStartKey), todayColumnIndex));
  }, [todayColumnIndex, weekStartKey]);

  const todayHours = useMemo(
    () => (todayDayKey ? hoursForDayKey(todayDayKey) : null),
    [hoursForDayKey, todayDayKey],
  );

  const showTodayNowIndicator =
    showNowIndicator &&
    todayColumnIndex >= 0 &&
    todayHours != null &&
    isMinuteInWorkingWindow(
      nowMinutes,
      todayHours.startHour,
      todayHours.endHour,
    );

  const pxPerMinute = hourHeight / MINUTES_PER_HOUR;
  const gridHeight = useMemo(
    () =>
      gridHeightForHourRange(
        gridStartHour,
        gridEndHour,
        pxPerMinute,
        hourGap,
      ),
    [gridEndHour, gridStartHour, hourGap, pxPerMinute],
  );
  const contentHeight = gridHeight + WEEK_VIEW_GRID_EDGE_INSET * 2;
  const closedShade = withOpacity(native.foreground.muted, 0.08);

  const eventsByColumn = useMemo(() => {
    const weekStart = parseDayKey(weekStartKey);

    return Array.from({ length: WEEK_DAYS }, (_, columnIndex) => {
      const dayKey = toDayKey(addDays(weekStart, columnIndex));
      const dayHours = hoursForDayKey(dayKey);
      if (!dayHours) {
        return { events: [], overflows: [] };
      }

      return layoutDayColumnEvents(
        eventsByDay[dayKey] ?? [],
        dayKey,
        dayHours.startHour,
        dayHours.endHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
        gridStartHour,
      );
    });
  }, [
    eventsByDay,
    gridStartHour,
    hourGap,
    hoursForDayKey,
    pxPerMinute,
    weekStartKey,
  ]);

  const hourLines = useMemo(
    () =>
      buildHourLineTops(
        gridStartHour,
        gridEndHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [gridEndHour, gridStartHour, hourGap, pxPerMinute],
  );

  const halfHourLines = useMemo(
    () =>
      buildHalfHourLineTops(
        gridStartHour,
        gridEndHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [gridEndHour, gridStartHour, hourGap, pxPerMinute],
  );

  const nowLineY = useMemo(
    () =>
      nowLineYForMinutes(
        nowMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [gridStartHour, hourGap, nowMinutes, pxPerMinute],
  );

  const scrollToInitial = useCallback(() => {
    if (!scrollToNowOnMount) return;

    const anchorMinutes = showTodayNowIndicator
      ? nowMinutes
      : gridStartHour * MINUTES_PER_HOUR;
    const anchorY =
      WEEK_VIEW_GRID_EDGE_INSET +
      minutesToYInWorkingWindow(
        anchorMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
      );
    const paddingY = minutesToY(
      WEEK_VIEW_SCROLL_PADDING_MINUTES,
      pxPerMinute,
      hourGap,
    );
    scrollRef.current?.scrollTo({
      y: Math.max(0, anchorY - paddingY),
      animated: false,
    });
  }, [
    gridStartHour,
    hourGap,
    nowMinutes,
    pxPerMinute,
    scrollToNowOnMount,
    showTodayNowIndicator,
  ]);

  useEffect(() => {
    if (!showTodayNowIndicator) return;
    const tick = () => setNowMinutes(localMinutesFromMidnight(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [showTodayNowIndicator]);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [weekStartKey, gridStartHour, gridEndHour]);

  const gridBorderColor = native.border.strong;
  const gridBorderWidth = semantic.borderWidth.strong;
  const halfHourBorderColor = native.border.subtle;
  const halfHourBorderWidth = semantic.borderWidth.subtle;
  const nowIndicatorColor = native.brand.default;

  const onContentSizeChange = useCallback(() => {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    scrollToInitial();
  }, [scrollToInitial]);

  const handleScrollBeginDrag = useCallback(() => {
    onVerticalScrollBegin?.();
  }, [onVerticalScrollBegin]);

  const handleScrollEnd = useCallback(() => {
    onVerticalScrollEnd?.();
  }, [onVerticalScrollEnd]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={Platform.OS === "android"}
      directionalLockEnabled={Platform.OS === "ios"}
      onContentSizeChange={onContentSizeChange}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollEnd={handleScrollEnd}
    >
      <View style={{ flexDirection: "row", height: contentHeight }}>
        <TimeGutter
          width={gutterWidth}
          hourHeight={hourHeight}
          hourGap={hourGap}
          contentInsetTop={WEEK_VIEW_GRID_EDGE_INSET}
          startHour={gridStartHour}
          endHour={gridEndHour}
        />

        <View style={{ flex: 1, position: "relative" }}>
          {halfHourLines.map((top, index) => (
            <View
              key={`half-hour-line-${index}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                borderTopWidth: halfHourBorderWidth,
                borderTopColor: halfHourBorderColor,
                borderStyle: "dashed",
              }}
            />
          ))}

          {hourLines.map((top, index) => (
            <View
              key={`hour-line-${index}`}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                height: gridBorderWidth,
                backgroundColor: gridBorderColor,
              }}
            />
          ))}

          {showTodayNowIndicator ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: nowLineY - WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT / 2,
                height: WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
                flexDirection: "row",
                zIndex: 1,
              }}
            >
              {Array.from({ length: WEEK_DAYS }, (_, columnIndex) => (
                <View key={`now-col-${columnIndex}`} style={{ flex: 1 }}>
                  {columnIndex === todayColumnIndex ? (
                    <TimedGridNowIndicator color={nowIndicatorColor} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              height: contentHeight,
            }}
          >
            {Array.from({ length: WEEK_DAYS }, (_, columnIndex) => {
              const weekStart = parseDayKey(weekStartKey);
              const dayKey = toDayKey(addDays(weekStart, columnIndex));
              const dayHours = hoursForDayKey(dayKey);

              return (
                <View
                  key={`day-col-${columnIndex}`}
                  style={{ flex: 1, position: "relative" }}
                >
                  {dayHours ? (
                    <TimedGridSlotLayer
                      contentHeight={contentHeight}
                      dayKey={dayKey}
                      endHour={dayHours.endHour}
                      gridEdgeInset={WEEK_VIEW_GRID_EDGE_INSET}
                      gridEndHour={gridEndHour}
                      gridStartHour={gridStartHour}
                      hourGap={hourGap}
                      pxPerMinute={pxPerMinute}
                      startHour={dayHours.startHour}
                      variant="week"
                    />
                  ) : (
                    <View
                      pointerEvents="none"
                      style={{
                        ...{ position: "absolute", left: 0, right: 0, top: 0 },
                        height: contentHeight,
                        backgroundColor: closedShade,
                      }}
                    />
                  )}
                  {eventsByColumn[columnIndex]?.events.map((block) => (
                    <WeekEventBlock
                      key={block.event.id}
                      event={block.event}
                      top={block.top}
                      height={block.height}
                      left={block.left}
                      width={block.width}
                    />
                  ))}
                  {eventsByColumn[columnIndex]?.overflows.map(
                    (overflow, index) => (
                      <TimedGridOverflowChip
                        key={`overflow-${columnIndex}-${index}`}
                        count={overflow.count}
                        top={overflow.top}
                        height={overflow.height}
                        left={overflow.left}
                        width={overflow.width}
                      />
                    ),
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export const WeekTimeGrid = memo(WeekTimeGridComponent);

/** @deprecated Use WEEK_VIEW_GUTTER_WIDTH from @/constants/schedule */
export const WEEK_TIME_GRID_GUTTER_WIDTH = WEEK_VIEW_GUTTER_WIDTH;
