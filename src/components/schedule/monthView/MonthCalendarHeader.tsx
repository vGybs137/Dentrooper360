import { memo, useMemo } from "react";
import { View } from "react-native";

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
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      <ThemedText variant="title">{formatYearMonthLabel(yearMonth)}</ThemedText>
    </View>
  );
}

export const MonthCalendarHeader = memo(MonthCalendarHeaderComponent);
