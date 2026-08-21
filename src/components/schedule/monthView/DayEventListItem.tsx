import { useRouter, type Href } from "expo-router";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeTokens } from "@/theme";
import { formatTimeRange } from "@/utils/calendar";

import type { MonthDayEventPreview } from "./types";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

function withOpacity(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Matches feature/schedule-big-calendar DayAppointmentEvent day-variant card. */
function DayEventListItemComponent({ event }: DayEventListItemProps) {
  const theme = useThemeTokens();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const hasType = Boolean(event.color || event.typeName);
  const typeColor = event.color ?? theme.colors.borderStrong;
  const cardBackground = withOpacity(theme.colors.brand, 0.5);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      style={{ paddingHorizontal: 16, paddingVertical: 4 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          overflow: "hidden",
          borderRadius: theme.semantic.radius.card,
          paddingVertical: 6,
          paddingLeft: 6,
          paddingRight: 8,
          backgroundColor: cardBackground,
          borderColor: theme.colors.borderStrong,
        }}
      >
        <View
          style={{
            width: 4,
            marginRight: 6,
            borderRadius: 2,
            backgroundColor: typeColor,
            opacity: 1,
          }}
        />
        <View style={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              lineHeight: 16,
              fontWeight: "600",
            }}
          >
            <Text style={{ color: theme.colors.text }}>{event.title}</Text>
            {event.typeName && (
              <Text style={{ color: theme.colors.text }}> - </Text>
            )}
            {event.typeName && (
              <Text style={{ color: typeColor }}>{event.typeName}</Text>
            )}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              color: theme.colors.text,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "400",
            }}
          >
            {timeRange}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const DayEventListItem = memo(DayEventListItemComponent);
