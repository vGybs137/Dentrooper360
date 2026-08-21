import { memo } from "react";
import { Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import { ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import { formatTimeRange } from "@/utils/calendar";

import type { MonthDayEventPreview } from "./types";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

function DayEventListItemComponent({ event }: DayEventListItemProps) {
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
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.palette.border.subtle,
      }}
    >
      <View
        style={{
          width: 4,
          alignSelf: "stretch",
          minHeight: 36,
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

export const DayEventListItem = memo(DayEventListItemComponent);
