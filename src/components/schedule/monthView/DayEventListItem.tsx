import { type Href, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatTimeRange } from "@/utils/calendar";

import type { MonthDayEventPreview } from "./types";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

export function DayEventListItem({ event }: DayEventListItemProps) {
  const theme = useThemeTokens();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatTimeRange(event.startTime, event.endTime)}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.semantic.space.stack.compact,
        paddingVertical: theme.semantic.space.stack.compact,
        paddingHorizontal: theme.semantic.space.inline.compact,
      }}
    >
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          minHeight: 28,
          borderRadius: 2,
          backgroundColor: event.color,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText numberOfLines={1} variant="body">
          {event.title}
        </ThemedText>
        <ThemedText tone="muted" variant="label">
          {formatTimeRange(event.startTime, event.endTime)}
        </ThemedText>
      </View>
    </Pressable>
  );
}
