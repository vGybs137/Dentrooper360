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
      paddingBottom: semantic.space.stack.compact,
      marginBottom: semantic.space.stack.compact,
    }),
    [],
  );

  return (
    <View
      className="w-full self-stretch"
      style={[{ flexDirection: "row" }, rootStyle]}
    >
      {labels.map((label, index) => {
        const weekday = ((weekStartsOn + index) % 7) as WeekdayIndex;
        const isSunday = weekday === 0;
        return (
          <View key={`${label}-${index}`} className="flex-1 items-center">
            <ThemedText tone={isSunday ? "alert" : "muted"} variant="label">
              {label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export const WeekdayHeader = memo(WeekdayHeaderComponent);
