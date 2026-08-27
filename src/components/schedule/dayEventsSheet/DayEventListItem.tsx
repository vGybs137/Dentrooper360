import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui";

import { formatAppointmentEventTitle } from "@/helpers/appointmentSubject";
import { formatTimeRange } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useThemeTokens } from "@/theme";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

/** Day-events sheet row — title, type color rail, and time range. */
function DayEventListItemComponent({ event }: DayEventListItemProps) {
  const theme = useThemeTokens();
  const hourFormat = useHourFormat();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime, hourFormat);
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

  const listTitle = formatAppointmentEventTitle(event.title, event.typeName);

  return (
    <Button
      accessibilityLabel={`${listTitle}, ${timeRange}`}
      className="px-page py-stack-compact"
      nestedScroll
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      ripple={false}
      size="none"
      tone="neutral"
      variant="ghost"
    >
      <View style={cardStyle}>
        <View style={railStyle} />
        <View style={bodyStyle}>
          <Text numberOfLines={1} style={titleStyle}>
            <Text style={{ color: theme.colors.text }}>
              {event.title.trim() || "Appointment"}
            </Text>
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
    </Button>
  );
}

export const DayEventListItem = memo(DayEventListItemComponent);
