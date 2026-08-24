import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeTokens } from "@/theme";
import { formatTimeRange } from "@/utils/calendar";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

/** Matches feature/schedule-big-calendar DayAppointmentEvent day-variant card. */
function DayEventListItemComponent({ event }: DayEventListItemProps) {
  const theme = useThemeTokens();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const typeColor = event.color ?? theme.colors.borderStrong;

  const cardStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      overflow: "hidden" as const,
      borderRadius: theme.semantic.radius.card,
      paddingVertical: theme.semantic.space.stack.compact,
      paddingLeft: theme.semantic.space.stack.compact,
      paddingRight: theme.semantic.space.stack.default,
      gap: theme.semantic.space.stack.compact,
      borderColor: theme.colors.borderStrong,
    }),
    [theme],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
      marginRight: theme.semantic.space.stack.compact,
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

  const timeStyle = useMemo(
    () => ({
      marginTop: theme.primitives.space[2],
      color: theme.colors.text,
      fontSize: theme.primitives.fontSize.xs,
      lineHeight: theme.primitives.lineHeight.xs,
      fontWeight: theme.primitives.fontWeight.regular,
    }),
    [theme],
  );

  const bodyStyle = useMemo(
    () => ({
      flex: 1,
      minWidth: 0,
      justifyContent: "center" as const,
    }),
    [],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      className="px-page py-stack-compact"
    >
      <View style={cardStyle}>
        <View style={railStyle} />
        <View style={bodyStyle}>
          <Text numberOfLines={1} style={titleStyle}>
            <Text style={{ color: theme.colors.text }}>{event.title}</Text>
            {event.typeName ? (
              <Text style={{ color: theme.colors.text }}> - </Text>
            ) : null}
            {event.typeName ? (
              <Text style={{ color: typeColor }}>{event.typeName}</Text>
            ) : null}
          </Text>
          <Text numberOfLines={1} style={timeStyle}>
            {timeRange}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const DayEventListItem = memo(DayEventListItemComponent);
