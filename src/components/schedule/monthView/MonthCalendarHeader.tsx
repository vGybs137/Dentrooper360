import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import {
  formatYearMonthLabel,
  type YearMonth,
} from "@/utils/calendar";

export type MonthCalendarHeaderProps = {
  yearMonth: YearMonth;
};

export function MonthCalendarHeader({ yearMonth }: MonthCalendarHeaderProps) {
  const theme = useThemeTokens();

  return (
    <View
      style={{
        paddingBottom: theme.semantic.space.stack.compact,
      }}
    >
      <ThemedText variant="title">{formatYearMonthLabel(yearMonth)}</ThemedText>
    </View>
  );
}
