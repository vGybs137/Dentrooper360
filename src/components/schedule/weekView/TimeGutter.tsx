import { memo, useMemo } from "react";
import { View } from "react-native";
import { primitives } from "@/tokens";

import { ThemedText } from "@/components/ui";
import {
  WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT,
} from "@/constants/schedule";
import { formatHourLabel } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import {
  MINUTES_PER_HOUR,
  minutesToYInWorkingWindow,
} from "@/utils/calendar";

export type TimeGutterProps = {
  width: number;
  hourHeight: number;
  hourGap: number;
  /** Extra top offset so edge labels are not clipped. */
  contentInsetTop?: number;
  /** Inclusive first hour row (0–23). */
  startHour?: number;
  /** Inclusive last hour row (0–23). */
  endHour?: number;
};

/** @deprecated Use WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT from @/constants/schedule */
export const TIME_GUTTER_LABEL_LINE_HEIGHT = WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT;

function TimeGutterComponent({
  width,
  hourHeight,
  hourGap,
  contentInsetTop = 0,
  startHour = 0,
  endHour = 23,
}: TimeGutterProps) {
  const hourFormat = useHourFormat();
  const pxPerMinute = hourHeight / MINUTES_PER_HOUR;
  const labels = useMemo(() => {
    const start = Math.max(0, Math.min(startHour, 23));
    const end = Math.max(start, Math.min(endHour, 23));
    const items: { hour: number; label: string }[] = [];
    for (let hour = start; hour <= end; hour++) {
      items.push({ hour, label: formatHourLabel(hour, hourFormat) });
    }
    return items;
  }, [endHour, hourFormat, startHour]);

  const labelStyle = useMemo(
    () => ({
      fontSize: 10,
      lineHeight: WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT,
      fontWeight: primitives.fontWeight.regular as "400",
    }),
    [],
  );

  return (
    <View style={{ width, position: "relative", overflow: "visible" }}>
      {labels.map(({ hour, label }) => {
        const lineY =
          contentInsetTop +
          minutesToYInWorkingWindow(
            hour * MINUTES_PER_HOUR,
            startHour,
            pxPerMinute,
            hourGap,
          );
        return (
          <View
            key={hour}
            style={{
              position: "absolute",
              top: lineY - WEEK_VIEW_GUTTER_LABEL_LINE_HEIGHT / 2,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <ThemedText
              tone="muted"
              variant="label"
              numberOfLines={1}
              style={labelStyle}
            >
              {label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export const TimeGutter = memo(TimeGutterComponent);
