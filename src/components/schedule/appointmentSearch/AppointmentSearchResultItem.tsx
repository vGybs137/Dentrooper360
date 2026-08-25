import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";
import { formatTimeRange } from "@/utils/calendar";

export type AppointmentSearchResultItemProps = {
  event: MonthDayEventPreview;
};

function AppointmentSearchResultItemComponent({
  event,
}: AppointmentSearchResultItemProps) {
  const theme = useThemeTokens();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const typeColor = event.color ?? theme.colors.borderStrong;

  const rowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      overflow: "hidden" as const,
      paddingVertical: theme.semantic.space.stack.compact,
      gap: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
      borderRadius: theme.primitives.radius.xs,
      backgroundColor: typeColor,
    }),
    [theme, typeColor],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: theme.primitives.fontSize.sm,
      lineHeight: theme.primitives.lineHeight.sm,
      fontWeight: theme.primitives.fontWeight.semibold,
    }),
    [theme],
  );

  const metaStyle = useMemo(
    () => ({
      marginTop: theme.primitives.space[2],
      color: theme.colors.textMuted,
      fontSize: theme.primitives.fontSize.xs,
      lineHeight: theme.primitives.lineHeight.xs,
      fontWeight: theme.primitives.fontWeight.regular,
    }),
    [theme],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      style={rowStyle}
    >
      <View style={railStyle} />
      <View className="min-w-0 flex-1 justify-center">
        <Text numberOfLines={1} style={titleStyle}>
          <Text style={{ color: theme.colors.text }}>{event.title}</Text>
          {event.typeName ? (
            <Text style={{ color: theme.colors.text }}> - </Text>
          ) : null}
          {event.typeName ? (
            <Text style={{ color: typeColor }}>{event.typeName}</Text>
          ) : null}
        </Text>
        <Text numberOfLines={1} style={metaStyle}>
          {timeRange}
        </Text>
      </View>
    </Pressable>
  );
}

export const AppointmentSearchResultItem = memo(
  AppointmentSearchResultItemComponent,
);
