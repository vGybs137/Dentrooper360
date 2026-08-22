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
  TimedGridNowIndicator,
} from "@/components/schedule/timedGrid";
import {
  WEEK_VIEW_GUTTER_WIDTH,
  WEEK_VIEW_GRID_EDGE_INSET,
  WEEK_VIEW_HOUR_GAP,
  WEEK_VIEW_HOUR_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
  WEEK_VIEW_SCROLL_PADDING_MINUTES,
} from "@/constants/schedule";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import type { WeekEventsByDay } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useThemeTokens } from "@/theme";
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
} from "@/utils/calendar";

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
  const theme = useThemeTokens();
  const { startHour, endHour } = useUserScheduleHours();
  const scrollRef = useRef<ScrollViewType>(null);
  const hasScrolledRef = useRef(false);
  const todayColumnIndex = useMemo(
    () => todayColumnIndexForWeek(weekStartKey),
    [weekStartKey],
  );
  const [nowMinutes, setNowMinutes] = useState(() =>
    localMinutesFromMidnight(new Date()),
  );
  const showTodayNowIndicator =
    showNowIndicator &&
    todayColumnIndex >= 0 &&
    isMinuteInWorkingWindow(nowMinutes, startHour, endHour);

  const pxPerMinute = hourHeight / MINUTES_PER_HOUR;
  const gridHeight = useMemo(
    () => gridHeightForHourRange(startHour, endHour, pxPerMinute, hourGap),
    [endHour, hourGap, pxPerMinute, startHour],
  );
  const contentHeight = gridHeight + WEEK_VIEW_GRID_EDGE_INSET * 2;

  const eventsByColumn = useMemo(() => {
    const weekStart = parseDayKey(weekStartKey);

    return Array.from({ length: WEEK_DAYS }, (_, columnIndex) => {
      const dayKey = toDayKey(addDays(weekStart, columnIndex));
      return layoutDayColumnEvents(
        eventsByDay[dayKey] ?? [],
        dayKey,
        startHour,
        endHour,
        pxPerMinute,
        hourGap,
      );
    });
  }, [endHour, eventsByDay, hourGap, pxPerMinute, startHour, weekStartKey]);

  const hourLines = useMemo(
    () =>
      buildHourLineTops(
        startHour,
        endHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [endHour, hourGap, pxPerMinute, startHour],
  );

  const halfHourLines = useMemo(
    () =>
      buildHalfHourLineTops(
        startHour,
        endHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [endHour, hourGap, pxPerMinute, startHour],
  );

  const nowLineY = useMemo(
    () =>
      nowLineYForMinutes(
        nowMinutes,
        startHour,
        pxPerMinute,
        hourGap,
        WEEK_VIEW_GRID_EDGE_INSET,
      ),
    [hourGap, nowMinutes, pxPerMinute, startHour],
  );

  const scrollToInitial = useCallback(() => {
    if (!scrollToNowOnMount) return;

    const anchorMinutes = showTodayNowIndicator
      ? nowMinutes
      : startHour * MINUTES_PER_HOUR;
    const anchorY =
      WEEK_VIEW_GRID_EDGE_INSET +
      minutesToYInWorkingWindow(anchorMinutes, startHour, pxPerMinute, hourGap);
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
    hourGap,
    nowMinutes,
    pxPerMinute,
    scrollToNowOnMount,
    showTodayNowIndicator,
    startHour,
  ]);

  useEffect(() => {
    if (!showTodayNowIndicator) return;
    const tick = () => setNowMinutes(localMinutesFromMidnight(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [showTodayNowIndicator]);

  const gridBorderColor = theme.colors.borderStrong;
  const gridBorderWidth = theme.semantic.borderWidth.strong;
  const halfHourBorderColor = theme.colors.borderSubtle;
  const halfHourBorderWidth = theme.semantic.borderWidth.subtle;
  const nowIndicatorColor = theme.palette.brand.default;

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
      className="flex-1"
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
          startHour={startHour}
          endHour={endHour}
        />

        <View className="flex-1" style={{ position: "relative" }}>
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
            {Array.from({ length: WEEK_DAYS }, (_, columnIndex) => (
              <View
                key={`day-col-${columnIndex}`}
                style={{ flex: 1, position: "relative" }}
              >
                {eventsByColumn[columnIndex]?.map((block) => (
                  <WeekEventBlock
                    key={block.event.id}
                    event={block.event}
                    top={block.top}
                    height={block.height}
                    left={block.left}
                    width={block.width}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export const WeekTimeGrid = memo(WeekTimeGridComponent);

/** @deprecated Use WEEK_VIEW_GUTTER_WIDTH from @/constants/schedule */
export const WEEK_TIME_GRID_GUTTER_WIDTH = WEEK_VIEW_GUTTER_WIDTH;
