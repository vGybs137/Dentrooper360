import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import type { ScrollView as ScrollViewType } from "react-native-gesture-handler";

import {
  WEEK_VIEW_GUTTER_WIDTH,
  WEEK_VIEW_GRID_EDGE_INSET,
  WEEK_VIEW_HOUR_GAP,
  WEEK_VIEW_HOUR_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_ARROW_WIDTH,
  WEEK_VIEW_SCROLL_PADDING_MINUTES,
} from "@/constants/schedule";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import { useThemeTokens } from "@/theme";
import {
  addDays,
  clipEventToDay,
  clipEventToWorkingWindow,
  gridHeightForHourRange,
  isMinuteInWorkingWindow,
  layoutTimedEventsForDay,
  MINUTES_PER_HOUR,
  minutesSpanToHeight,
  minutesToY,
  minutesToYInWorkingWindow,
  parseDayKey,
  sameDay,
  timedEventColumnRect,
  todayCalendarDate,
  toDayKey,
  WEEK_DAYS,
  type DayKey,
} from "@/utils/calendar";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { WeekEventsByDay } from "@/hooks/schedule/useWeekAppointmentsCache";

import { TimeGutter } from "./TimeGutter";
import { WeekEventBlock } from "./WeekEventBlock";

type PositionedWeekEvent = {
  event: MonthDayEventPreview;
  top: number;
  height: number;
  left: number;
  width: number;
};

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

function localMinutesFromMidnight(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

function layoutDayColumnEvents(
  events: MonthDayEventPreview[],
  dayKey: DayKey,
  startHour: number,
  endHour: number,
  pxPerMinute: number,
  hourGap: number,
): PositionedWeekEvent[] {
  const previews = new Map<string, MonthDayEventPreview>();
  const timedInputs = [];

  for (const event of events) {
    const clippedDay = clipEventToDay(event.startTime, event.endTime, dayKey);
    if (!clippedDay) continue;

    const clipped = clipEventToWorkingWindow(
      clippedDay.startMinutes,
      clippedDay.endMinutes,
      startHour,
      endHour,
    );
    if (!clipped) continue;

    previews.set(event.id, event);
    timedInputs.push({
      id: event.id,
      startMinutes: clipped.startMinutes,
      endMinutes: clipped.endMinutes,
    });
  }

  return layoutTimedEventsForDay(timedInputs).map((layout) => {
    const rect = timedEventColumnRect(layout.column, layout.maxColumns);
    return {
      event: previews.get(layout.id)!,
      top:
        WEEK_VIEW_GRID_EDGE_INSET +
        minutesToYInWorkingWindow(
          layout.startMinutes,
          startHour,
          pxPerMinute,
          hourGap,
        ),
      height: minutesSpanToHeight(
        layout.startMinutes,
        layout.endMinutes,
        pxPerMinute,
        hourGap,
      ),
      left: rect.left,
      width: rect.width,
    };
  });
}

type NowIndicatorArrowProps = {
  color: string;
  width: number;
  height: number;
};

function NowIndicatorArrow({ color, width, height }: NowIndicatorArrowProps) {
  const halfHeight = height / 2;
  return (
    <View
      style={{
        width,
        height,
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          width: 0,
          height: 0,
          borderTopWidth: halfHeight,
          borderBottomWidth: halfHeight,
          borderLeftWidth: width,
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

type TodayNowIndicatorProps = {
  color: string;
};

function TodayNowIndicator({ color }: TodayNowIndicatorProps) {
  return (
    <View
      style={{
        flex: 1,
        height: WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          height: WEEK_VIEW_NOW_INDICATOR_HEIGHT,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <NowIndicatorArrow
          color={color}
          width={WEEK_VIEW_NOW_INDICATOR_ARROW_WIDTH}
          height={WEEK_VIEW_NOW_INDICATOR_ARROW_HEIGHT}
        />
      </View>
    </View>
  );
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

  const hourLines = useMemo(() => {
    const lines: number[] = [];
    for (let hour = startHour; hour <= endHour + 1; hour++) {
      lines.push(
        WEEK_VIEW_GRID_EDGE_INSET +
          minutesToYInWorkingWindow(
            hour * MINUTES_PER_HOUR,
            startHour,
            pxPerMinute,
            hourGap,
          ),
      );
    }
    return lines;
  }, [endHour, hourGap, pxPerMinute, startHour]);

  const halfHourLines = useMemo(() => {
    const lines: number[] = [];
    const windowStartMinutes = startHour * MINUTES_PER_HOUR;
    const windowEndMinutes = (endHour + 1) * MINUTES_PER_HOUR;

    for (
      let minutes = windowStartMinutes + 30;
      minutes < windowEndMinutes;
      minutes += MINUTES_PER_HOUR
    ) {
      lines.push(
        WEEK_VIEW_GRID_EDGE_INSET +
          minutesToYInWorkingWindow(minutes, startHour, pxPerMinute, hourGap),
      );
    }
    return lines;
  }, [endHour, hourGap, pxPerMinute, startHour]);

  const nowLineY = useMemo(
    () =>
      WEEK_VIEW_GRID_EDGE_INSET +
      minutesToYInWorkingWindow(nowMinutes, startHour, pxPerMinute, hourGap),
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
                    <TodayNowIndicator color={nowIndicatorColor} />
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
