import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

import type { MonthDayEventPreview } from "./types";

export type DayEventChipProps = {
  event: MonthDayEventPreview;
};

/** Compact in-cell event: type-color left rail + title. */
export function DayEventChip({ event }: DayEventChipProps) {
  const theme = useThemeTokens();
  const railColor = event.color ?? theme.palette.border.strong;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        minHeight: 12,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 2,
          alignSelf: "stretch",
          minHeight: 10,
          borderRadius: 1,
          backgroundColor: railColor,
          opacity: event.color ? 1 : 0.55,
        }}
      />
      <ThemedText
        numberOfLines={1}
        style={{
          flex: 1,
          color: theme.palette.foreground.default,
          fontSize: 9,
          lineHeight: 11,
          fontWeight: "500",
        }}
      >
        {event.title}
      </ThemedText>
    </View>
  );
}
