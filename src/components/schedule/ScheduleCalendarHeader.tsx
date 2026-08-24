import { memo, useMemo } from "react";
import { View } from "react-native";

import { ScheduleDrawerToggle } from "@/components/schedule/ScheduleDrawerToggle";
import { ScheduleSearchToggle } from "@/components/schedule/ScheduleSearchToggle";
import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

export type ScheduleCalendarHeaderProps = {
  title: string;
};

function ScheduleCalendarHeaderComponent({ title }: ScheduleCalendarHeaderProps) {
  const theme = useThemeTokens();

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      <ScheduleDrawerToggle />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ThemedText numberOfLines={1} variant="title">
          {title}
        </ThemedText>
      </View>
      <ScheduleSearchToggle />
    </View>
  );
}

export const ScheduleCalendarHeader = memo(ScheduleCalendarHeaderComponent);
