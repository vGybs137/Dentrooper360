import { useRouter, type Href } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Text, View, type ViewStyle } from "react-native";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { Button } from "@/components/ui";

import { timedGridAbsoluteStyle } from "@/components/schedule/timedGrid/timedGridPositionStyle";
import {
  MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
  MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
  MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
import { formatAppointmentEventTitle } from "@/helpers/appointmentSubject";
import { withOpacity } from "@/helpers/color";
import { formatTimeRange } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import type { MonthDayEventPreview } from "@/types/schedule";

export type WeekEventBlockVariant = "week" | "day";

export type WeekEventBlockProps = {
  event: MonthDayEventPreview;
  top: number;
  height: number;
  /** Fractional offset within the day column (0–1). */
  left: number;
  /** Fractional width within the day column (0–1). */
  width: number;
  variant?: WeekEventBlockVariant;
};

function WeekEventBlockComponent({
  event,
  top,
  height,
  left,
  width,
  variant = "week",
}: WeekEventBlockProps) {
  const native = useNativeColors();
  const hourFormat = useHourFormat();
  const router = useRouter();
  const isDayVariant = variant === "day";
  const hasType = Boolean(event.color);
  const typeColor = event.color ?? native.border.strong;
  const timeRange = formatTimeRange(event.startTime, event.endTime, hourFormat);
  const durationMinutes = (event.endTime - event.startTime) / (60 * 1000);
  const isCompactDayEvent = isDayVariant && durationMinutes <= 30;
  const subjectLabel = event.title.trim() || "Appointment";

  const onPress = useCallback(() => {
    router.push(`/appointments/${event.id}` as Href);
  }, [event.id, router]);

  const rootStyle = useMemo(
    (): ViewStyle =>
      timedGridAbsoluteStyle(
        { top, height, left, width },
        { paddingHorizontal: 1, zIndex: 3 },
      ),
    [height, left, top, width],
  );

  const cardStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: "row" as const,
      overflow: "hidden" as const,
      borderRadius: primitives.radius.xs,
      backgroundColor: withOpacity(
        native.brand.default,
        MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
      ),
      borderWidth: semantic.borderWidth.subtle,
      borderColor: native.border.subtle,
    }),
    [native],
  );

  /** Week: full-height strip. Day: track that centers the type pill. */
  const railTrackStyle = useMemo(
    () =>
      isDayVariant
        ? {
            alignSelf: "stretch" as const,
            justifyContent: "center" as const,
            paddingLeft: primitives.space[4],
          }
        : null,
    [isDayVariant],
  );

  const railStyle = useMemo(
    () =>
      isDayVariant
        ? {
            width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
            height: "80%" as const,
            borderRadius: primitives.radius.full,
            backgroundColor: typeColor,
            opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
          }
        : {
            width: MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
            backgroundColor: typeColor,
            opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
          },
    [hasType, isDayVariant, native, typeColor],
  );

  const bodyStyle = useMemo(
    () => ({
      flex: 1,
      minWidth: 0,
      paddingHorizontal: isDayVariant
        ? primitives.space[4]
        : primitives.space[2],
      paddingVertical: isDayVariant
        ? primitives.space[4]
        : primitives.space[2],
      justifyContent:
        isDayVariant && !isCompactDayEvent
          ? ("flex-start" as const)
          : ("center" as const),
    }),
    [isCompactDayEvent, isDayVariant, native],
  );

  const titleStyle = useMemo(
    () =>
      isDayVariant
        ? {
            color: native.foreground.default,
            fontSize: primitives.fontSize.sm,
            lineHeight: primitives.lineHeight.sm,
            fontWeight: primitives.fontWeight.semibold as "600",
          }
        : {
            color: native.foreground.default,
            fontSize: 9,
            lineHeight: 11,
            fontWeight: primitives.fontWeight.medium as "500",
          },
    [isDayVariant, native],
  );

  const timeStyle = useMemo(
    () => ({
      marginTop: primitives.space[2],
      color: native.foreground.muted,
      fontSize: primitives.fontSize.xs,
      lineHeight: primitives.lineHeight.xs,
      fontWeight: primitives.fontWeight.regular as "400",
    }),
    [native],
  );

  const listTitle = formatAppointmentEventTitle(event.title, event.typeName);

  return (
    <Button
      accessibilityLabel={`${listTitle}, ${timeRange}`}
      nestedScroll
      onPress={onPress}
      ripple={false}
      size="none"
      style={rootStyle}
      tone="neutral"
      variant="ghost"
    >
      <View style={cardStyle}>
        {isDayVariant ? (
          <View style={railTrackStyle}>
            <View style={railStyle} />
          </View>
        ) : (
          <View style={railStyle} />
        )}
        <View style={bodyStyle}>
          {isDayVariant ? (
            isCompactDayEvent ? (
              <Text numberOfLines={1} style={titleStyle}>
                <Text style={{ color: native.foreground.default }}>{subjectLabel}</Text>
                {event.typeName ? (
                  <Text style={{ color: native.foreground.default }}> - </Text>
                ) : null}
                {event.typeName ? (
                  <Text style={{ color: typeColor }}>{event.typeName}</Text>
                ) : null}
                <Text style={timeStyle}>, {timeRange}</Text>
              </Text>
            ) : (
              <>
                <Text numberOfLines={1} style={titleStyle}>
                  <Text style={{ color: native.foreground.default }}>
                    {subjectLabel}
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
              </>
            )
          ) : (
            <Text numberOfLines={1} style={titleStyle}>
              {event.title}
            </Text>
          )}
        </View>
      </View>
    </Button>
  );
}

export const WeekEventBlock = memo(WeekEventBlockComponent);
