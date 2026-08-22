import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, type ScrollView as ScrollViewType } from "react-native";

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
import { useThemeTokens } from "@/theme";
import {
  addDays,
  gridHeightForDay,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToY,
  parseDayKey,
  sameDay,
  todayCalendarDate,
  WEEK_DAYS,
  type DayKey,
} from "@/utils/calendar";

import { TimeGutter } from "./TimeGutter";

export type WeekTimeGridProps = {
  weekStartKey: DayKey;
  hourHeight?: number;
  hourGap?: number;
  gutterWidth?: number;
  /** When true, scroll to the current local time on mount (today's week only). */
  scrollToNowOnMount?: boolean;
  /** Draw a horizontal line at the current local time in today's column. */
  showNowIndicator?: boolean;
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
  hourHeight = WEEK_VIEW_HOUR_HEIGHT,
  hourGap = WEEK_VIEW_HOUR_GAP,
  gutterWidth = WEEK_VIEW_GUTTER_WIDTH,
  scrollToNowOnMount = true,
  showNowIndicator = true,
}: WeekTimeGridProps) {
  const theme = useThemeTokens();
  const scrollRef = useRef<ScrollViewType>(null);
  const hasScrolledRef = useRef(false);
  const todayColumnIndex = useMemo(
    () => todayColumnIndexForWeek(weekStartKey),
    [weekStartKey],
  );
  const showTodayNowIndicator = showNowIndicator && todayColumnIndex >= 0;
  const [nowMinutes, setNowMinutes] = useState(() =>
    localMinutesFromMidnight(new Date()),
  );

  const pxPerMinute = hourHeight / MINUTES_PER_HOUR;
  const gridHeight = useMemo(
    () => gridHeightForDay(pxPerMinute, hourGap),
    [hourGap, pxPerMinute],
  );
  const contentHeight = gridHeight + WEEK_VIEW_GRID_EDGE_INSET * 2;

  const hourLines = useMemo(
    () =>
      Array.from({ length: 25 }, (_, hour) =>
        WEEK_VIEW_GRID_EDGE_INSET +
        minutesToY(hour * MINUTES_PER_HOUR, pxPerMinute, hourGap),
      ),
    [hourGap, pxPerMinute],
  );

  const halfHourLines = useMemo(() => {
    const lines: number[] = [];
    for (let minutes = 30; minutes < MINUTES_PER_DAY; minutes += MINUTES_PER_HOUR) {
      lines.push(
        WEEK_VIEW_GRID_EDGE_INSET + minutesToY(minutes, pxPerMinute, hourGap),
      );
    }
    return lines;
  }, [hourGap, pxPerMinute]);

  const nowLineY = useMemo(
    () =>
      WEEK_VIEW_GRID_EDGE_INSET +
      minutesToY(nowMinutes, pxPerMinute, hourGap),
    [hourGap, nowMinutes, pxPerMinute],
  );

  const scrollToNow = useCallback(() => {
    if (!scrollToNowOnMount || !showTodayNowIndicator) return;
    const anchorY =
      WEEK_VIEW_GRID_EDGE_INSET +
      minutesToY(nowMinutes, pxPerMinute, hourGap);
    const paddingY = minutesToY(
      WEEK_VIEW_SCROLL_PADDING_MINUTES,
      pxPerMinute,
      hourGap,
    );
    scrollRef.current?.scrollTo({
      y: Math.max(0, anchorY - paddingY),
      animated: false,
    });
  }, [hourGap, nowMinutes, pxPerMinute, scrollToNowOnMount, showTodayNowIndicator]);

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
    scrollToNow();
  }, [scrollToNow]);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={onContentSizeChange}
    >
      <View style={{ flexDirection: "row", height: contentHeight }}>
        <TimeGutter
          width={gutterWidth}
          hourHeight={hourHeight}
          hourGap={hourGap}
          contentInsetTop={WEEK_VIEW_GRID_EDGE_INSET}
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
              <View key={`day-col-${columnIndex}`} style={{ flex: 1 }} />
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
