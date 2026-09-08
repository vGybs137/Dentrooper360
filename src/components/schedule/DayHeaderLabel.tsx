import { memo, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { primitives, semantic } from "@/tokens";

import { ThemedText } from "@/components/ui";
import {
  formatDayKeyDayWeekdayParts,
  formatDayKeyDayWeekdayShortParts,
  parseDayKey,
  sameDay,
  todayCalendarDate,
  weekdayIndex,
  type DayKey,
} from "@/helpers/schedule/calendar";

export type DayHeaderLabelProps = {
  dayKey: DayKey;
  /** Long weekday in day view; short (ddd) in month sheet header. */
  weekdayFormat?: "long" | "short";
  style?: StyleProp<ViewStyle>;
};

function DayHeaderLabelComponent({
  dayKey,
  weekdayFormat = "long",
  style,
}: DayHeaderLabelProps) {
  const date = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const { day, weekday } = useMemo(
    () =>
      weekdayFormat === "short"
        ? formatDayKeyDayWeekdayShortParts(dayKey)
        : formatDayKeyDayWeekdayParts(dayKey),
    [dayKey, weekdayFormat],
  );
  const isToday = useMemo(() => sameDay(date, todayCalendarDate()), [date]);
  const isSunday = weekdayIndex(date) === 0;
  const tone = isToday ? "brand" : isSunday ? "alert" : "default";

  const rowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "baseline" as const,
      gap: primitives.space[8],
    }),
    [],
  );

  const dayStyle = useMemo(
    () => ({
      fontSize: semantic.type.title.fontSize,
      lineHeight: semantic.type.title.lineHeight,
      fontWeight: primitives.fontWeight.bold as "700",
    }),
    [],
  );

  const weekdayStyle = useMemo(
    () => ({
      fontWeight: primitives.fontWeight.medium as "500",
    }),
    [],
  );

  return (
    <View style={[rowStyle, style]}>
      <ThemedText tone={tone} variant="label" style={dayStyle}>
        {day}
      </ThemedText>
      <ThemedText tone={tone} variant="label" style={weekdayStyle}>
        {weekday}
      </ThemedText>
    </View>
  );
}

export const DayHeaderLabel = memo(DayHeaderLabelComponent);
