import { memo, useMemo } from "react";
import { ScrollView, View } from "react-native";

import { useThemeTokens } from "@/theme";
import {
  gridHeightForDay,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  minutesToY,
  WEEK_DAYS,
} from "@/utils/calendar";

import { TimeGutter, TIME_GUTTER_LABEL_LINE_HEIGHT } from "./TimeGutter";

/** Step 3 defaults — moved to constants/schedule in Step 4. */
const DEFAULT_HOUR_HEIGHT = 60;
const DEFAULT_HOUR_GAP = 1;
const DEFAULT_GUTTER_WIDTH = 36;
const GRID_EDGE_INSET = TIME_GUTTER_LABEL_LINE_HEIGHT / 2;

export type WeekTimeGridProps = {
  hourHeight?: number;
  hourGap?: number;
  gutterWidth?: number;
};

function WeekTimeGridComponent({
  hourHeight = DEFAULT_HOUR_HEIGHT,
  hourGap = DEFAULT_HOUR_GAP,
  gutterWidth = DEFAULT_GUTTER_WIDTH,
}: WeekTimeGridProps) {
  const theme = useThemeTokens();
  const pxPerMinute = hourHeight / MINUTES_PER_HOUR;
  const gridHeight = useMemo(
    () => gridHeightForDay(pxPerMinute, hourGap),
    [hourGap, pxPerMinute],
  );
  const contentHeight = gridHeight + GRID_EDGE_INSET * 2;

  const hourLines = useMemo(
    () =>
      Array.from({ length: 25 }, (_, hour) =>
        GRID_EDGE_INSET +
        minutesToY(hour * MINUTES_PER_HOUR, pxPerMinute, hourGap),
      ),
    [hourGap, pxPerMinute],
  );

  const halfHourLines = useMemo(() => {
    const lines: number[] = [];
    for (let minutes = 30; minutes < MINUTES_PER_DAY; minutes += MINUTES_PER_HOUR) {
      lines.push(
        GRID_EDGE_INSET + minutesToY(minutes, pxPerMinute, hourGap),
      );
    }
    return lines;
  }, [hourGap, pxPerMinute]);

  const gridBorderColor = theme.colors.borderStrong;
  const gridBorderWidth = theme.semantic.borderWidth.strong;
  const halfHourBorderColor = theme.colors.borderSubtle;
  const halfHourBorderWidth = theme.semantic.borderWidth.subtle;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator
    >
      <View style={{ flexDirection: "row", height: contentHeight }}>
        <TimeGutter
          width={gutterWidth}
          hourHeight={hourHeight}
          hourGap={hourGap}
          contentInsetTop={GRID_EDGE_INSET}
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

export const WEEK_TIME_GRID_GUTTER_WIDTH = DEFAULT_GUTTER_WIDTH;
