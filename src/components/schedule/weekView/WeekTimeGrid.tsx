import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, type ScrollView as ScrollViewType } from "react-native";

import {
  WEEK_VIEW_GUTTER_WIDTH,
  WEEK_VIEW_GRID_EDGE_INSET,
  WEEK_VIEW_HOUR_GAP,
  WEEK_VIEW_HOUR_HEIGHT,
  WEEK_VIEW_NOW_INDICATOR_HEIGHT,
  WEEK_VIEW_SCROLL_PADDING_MINUTES,
} from "@/constants/schedule";
import { useThemeTokens } from "@/theme";
import {
  gridHeightForDay,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToY,
  WEEK_DAYS,
} from "@/utils/calendar";

import { TimeGutter } from "./TimeGutter";

export type WeekTimeGridProps = {
  hourHeight?: number;
  hourGap?: number;
  gutterWidth?: number;
  /** When true, scroll to the current local time on mount. */
  scrollToNowOnMount?: boolean;
  /** Draw a horizontal line at the current local time. */
  showNowIndicator?: boolean;
};

function localMinutesFromMidnight(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
}

function WeekTimeGridComponent({
  hourHeight = WEEK_VIEW_HOUR_HEIGHT,
  hourGap = WEEK_VIEW_HOUR_GAP,
  gutterWidth = WEEK_VIEW_GUTTER_WIDTH,
  scrollToNowOnMount = true,
  showNowIndicator = true,
}: WeekTimeGridProps) {
  const theme = useThemeTokens();
  const scrollRef = useRef<ScrollViewType>(null);
  const hasScrolledRef = useRef(false);
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
    if (!scrollToNowOnMount) return;
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
  }, [hourGap, nowMinutes, pxPerMinute, scrollToNowOnMount]);

  useEffect(() => {
    if (!showNowIndicator) return;
    const tick = () => setNowMinutes(localMinutesFromMidnight(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [showNowIndicator]);

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
      showsVerticalScrollIndicator
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

          {showNowIndicator ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: nowLineY - WEEK_VIEW_NOW_INDICATOR_HEIGHT / 2,
                height: WEEK_VIEW_NOW_INDICATOR_HEIGHT,
                backgroundColor: nowIndicatorColor,
                zIndex: 1,
              }}
            />
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
