import { memo, useMemo } from "react";
import { View } from "react-native";

import { ScheduleViewModeToggle } from "@/components/schedule/ScheduleViewModeToggle";
import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatYearMonthLabel, type YearMonth } from "@/utils/calendar";

export type MonthCalendarHeaderProps = {
  yearMonth: YearMonth;
};

function MonthCalendarHeaderComponent({
  yearMonth,
}: MonthCalendarHeaderProps) {
  const theme = useThemeTokens();

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: theme.semantic.space.stack.compact,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      <ThemedText variant="title">{formatYearMonthLabel(yearMonth)}</ThemedText>
      <ScheduleViewModeToggle />
    </View>
  );
}

export const MonthCalendarHeader = memo(MonthCalendarHeaderComponent);
