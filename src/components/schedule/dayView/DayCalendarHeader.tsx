import { memo, useMemo } from "react";
import { View } from "react-native";

import { ScheduleViewModeToggle } from "@/components/schedule/ScheduleViewModeToggle";
import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatDayKeyMonthShort, type DayKey } from "@/utils/calendar";

export type DayCalendarHeaderProps = {
  dayKey: DayKey;
};

function DayCalendarHeaderComponent({ dayKey }: DayCalendarHeaderProps) {
  const theme = useThemeTokens();
  const label = useMemo(() => formatDayKeyMonthShort(dayKey), [dayKey]);

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
      <ThemedText variant="title">{label}</ThemedText>
      <ScheduleViewModeToggle />
    </View>
  );
}

export const DayCalendarHeader = memo(DayCalendarHeaderComponent);
