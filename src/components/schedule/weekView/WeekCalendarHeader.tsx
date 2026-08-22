import { memo, useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatWeekRangeLabel, type DayKey } from "@/utils/calendar";

export type WeekCalendarHeaderProps = {
  weekStartKey: DayKey;
  weekEndKey: DayKey;
};

function WeekCalendarHeaderComponent({
  weekStartKey,
  weekEndKey,
}: WeekCalendarHeaderProps) {
  const theme = useThemeTokens();
  const label = useMemo(
    () => formatWeekRangeLabel(weekStartKey, weekEndKey),
    [weekEndKey, weekStartKey],
  );

  const rootStyle = useMemo(
    () => ({
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      <ThemedText variant="title">{label}</ThemedText>
    </View>
  );
}

export const WeekCalendarHeader = memo(WeekCalendarHeaderComponent);
