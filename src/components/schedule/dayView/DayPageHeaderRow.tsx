import { memo, useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import {
  formatDayKeyDayWeekdayParts,
  parseDayKey,
  sameDay,
  todayCalendarDate,
  weekdayIndex,
  type DayKey,
} from "@/utils/calendar";

export type DayPageHeaderRowProps = {
  dayKey: DayKey;
  gutterWidth: number;
};

function DayPageHeaderRowComponent({
  dayKey,
  gutterWidth,
}: DayPageHeaderRowProps) {
  const theme = useThemeTokens();
  const date = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const { day, weekday } = useMemo(
    () => formatDayKeyDayWeekdayParts(dayKey),
    [dayKey],
  );
  const isToday = useMemo(() => sameDay(date, todayCalendarDate()), [date]);
  const isSunday = weekdayIndex(date) === 0;
  const tone = isToday ? "brand" : isSunday ? "alert" : "default";

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const labelRowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "baseline" as const,
      gap: theme.primitives.space[8],
      paddingHorizontal: theme.semantic.space.stack.compact,
      paddingVertical: theme.semantic.space.stack.comfortable,
    }),
    [theme],
  );

  const dayStyle = useMemo(
    () => ({
      fontSize: theme.semantic.type.title.fontSize,
      lineHeight: theme.semantic.type.title.lineHeight,
      fontWeight: theme.primitives.fontWeight.bold as "700",
    }),
    [theme],
  );

  const weekdayStyle = useMemo(
    () => ({
      fontWeight: theme.primitives.fontWeight.medium as "500",
    }),
    [theme],
  );

  return (
    <View className="w-full self-stretch" style={rootStyle}>
      <View style={{ width: gutterWidth }} />
      <View style={labelRowStyle}>
        <ThemedText tone={tone} variant="label" style={dayStyle}>
          {day}
        </ThemedText>
        <ThemedText tone={tone} variant="label" style={weekdayStyle}>
          {weekday}
        </ThemedText>
      </View>
    </View>
  );
}

export const DayPageHeaderRow = memo(DayPageHeaderRowComponent);
