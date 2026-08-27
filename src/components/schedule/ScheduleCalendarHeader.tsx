import { memo, useMemo } from "react";
import { View } from "react-native";
import { semantic } from "@/tokens";

import { ScheduleDrawerToggle } from "@/components/schedule/ScheduleDrawerToggle";
import { ScheduleSearchToggle } from "@/components/schedule/ScheduleSearchToggle";
import { ThemedText } from "@/components/ui";

export type ScheduleCalendarHeaderProps = {
  title: string;
};

function ScheduleCalendarHeaderComponent({ title }: ScheduleCalendarHeaderProps) {

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingBottom: semantic.space.stack.compact,
    }),
    [],
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
