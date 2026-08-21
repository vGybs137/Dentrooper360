import React, { useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import type { WeekdayIndex } from "@/utils/calendar";
import { toLocalDate } from "@/utils/calendar";

export type WeekdayHeaderProps = {
  weekStartsOn?: WeekdayIndex;
};

function weekdayLabels(weekStartsOn: WeekdayIndex, locale?: string): string[] {
  // Jan 4 2026 is a Sunday — use it as a stable weekday anchor.
  const sunday = toLocalDate({ year: 2026, month: 0, day: 4 });
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const labels: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + ((weekStartsOn + i) % 7));
    labels.push(formatter.format(day));
  }

  return labels;
}

export function WeekdayHeader({ weekStartsOn = 0 }: WeekdayHeaderProps) {
  const theme = useThemeTokens();
  const labels = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        alignSelf: "stretch",
        paddingBottom: theme.semantic.space.stack.compact,
        borderBottomWidth: 1,
        borderBottomColor: theme.palette.border.default,
        marginBottom: theme.semantic.space.stack.compact,
      }}
    >
      {labels.map((label, index) => (
        <View
          key={`${label}-${index}`}
          style={{ flex: 1, alignItems: "center" }}
        >
          <ThemedText tone="muted" variant="label">
            {label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
