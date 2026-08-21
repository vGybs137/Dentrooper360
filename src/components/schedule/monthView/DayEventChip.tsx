import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

import type { MonthDayEventPreview } from "./types";

export type DayEventChipProps = {
  event: MonthDayEventPreview;
};

/** Compact in-cell event bar for the month grid. */
export function DayEventChip({ event }: DayEventChipProps) {
  const theme = useThemeTokens();

  return (
    <View
      style={{
        borderRadius: theme.semantic.radius.control,
        paddingHorizontal: 3,
        paddingVertical: 1,
        backgroundColor: event.color,
        minHeight: 14,
        justifyContent: "center",
      }}
    >
      <ThemedText
        numberOfLines={1}
        style={{
          color: theme.palette.foreground.inverse,
          fontSize: 9,
          lineHeight: 11,
          fontWeight: "600",
        }}
      >
        {event.title}
      </ThemedText>
    </View>
  );
}
