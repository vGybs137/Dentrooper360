import { memo, useMemo } from "react";
import { View } from "react-native";
import { semantic } from "@/tokens";

import { ThemedText } from "@/components/ui";
import { weekdayLabels } from "@/helpers/weekdayLabels";
import type { WeekdayIndex } from "@/utils/calendar";

export type WeekdayHeaderProps = {
  weekStartsOn?: WeekdayIndex;
};

function WeekdayHeaderComponent({ weekStartsOn = 0 }: WeekdayHeaderProps) {
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignSelf: "stretch" as const,
      width: "100%" as const,
      paddingBottom: semantic.space.stack.compact,
      marginBottom: semantic.space.stack.compact,
    }),
    [],
  );

  const cellStyle = useMemo(
    () => ({
      flex: 1,
      alignItems: "center" as const,
    }),
    [],
  );

  return (
    <View style={rootStyle}>
      {labels.map((label, index) => {
        const weekday = ((weekStartsOn + index) % 7) as WeekdayIndex;
        const isSunday = weekday === 0;
        return (
          <View key={`${label}-${index}`} style={cellStyle}>
            <ThemedText
              style={{ textAlign: "center" }}
              tone={isSunday ? "alert" : "muted"}
              variant="label"
            >
              {label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export const WeekdayHeader = memo(WeekdayHeaderComponent);
