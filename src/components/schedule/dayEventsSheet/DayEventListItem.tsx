import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { Button } from "@/components/ui";

import { formatAppointmentEventTitle } from "@/helpers/appointmentSubject";
import { formatTimeRange } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";

export type DayEventListItemProps = {
  event: MonthDayEventPreview;
};

/** Day-events sheet row — title, type color rail, and time range. */
function DayEventListItemComponent({ event }: DayEventListItemProps) {
  const native = useNativeColors();
  const hourFormat = useHourFormat();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime, hourFormat);
  const typeColor = event.color ?? native.border.strong;

  const cardStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      overflow: "hidden" as const,
      borderRadius: semantic.radius.card,
      paddingVertical: semantic.space.stack.compact,
      paddingLeft: semantic.space.stack.compact,
      paddingRight: semantic.space.stack.default,
      gap: semantic.space.stack.compact,
      borderColor: native.border.strong,
    }),
    [native],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
      marginRight: semantic.space.stack.compact,
      borderRadius: primitives.radius.xs,
      backgroundColor: typeColor,
    }),
    [native, typeColor],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: primitives.fontSize.sm,
      lineHeight: primitives.lineHeight.sm,
      fontWeight: primitives.fontWeight.semibold,
    }),
    [native],
  );

  const timeStyle = useMemo(
    () => ({
      marginTop: primitives.space[2],
      color: native.foreground.default,
      fontSize: primitives.fontSize.xs,
      lineHeight: primitives.lineHeight.xs,
      fontWeight: primitives.fontWeight.regular,
    }),
    [native],
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
            <Text style={{ color: native.foreground.default }}>
              {event.title.trim() || "Appointment"}
            </Text>
            {event.typeName ? (
              <Text style={{ color: native.foreground.default }}> - </Text>
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
