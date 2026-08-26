import { useRouter, type Href } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import { timedGridAbsoluteStyle } from "@/components/schedule/timedGrid/timedGridPositionStyle";
import {
  MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
  MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
  MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
import { formatAppointmentEventTitle } from "@/helpers/appointmentSubject";
import { withOpacity } from "@/helpers/color";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";
import { formatTimeRange } from "@/utils/calendar";

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
  const theme = useThemeTokens();
  const router = useRouter();
  const isDayVariant = variant === "day";
  const hasType = Boolean(event.color);
  const typeColor = event.color ?? theme.palette.border.strong;
  const timeRange = formatTimeRange(event.startTime, event.endTime);
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
      borderRadius: theme.primitives.radius.xs,
      backgroundColor: withOpacity(
        theme.colors.brand,
        MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
      ),
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.colors.borderSubtle,
    }),
    [theme],
  );

  /** Week: full-height strip. Day: track that centers the type pill. */
  const railTrackStyle = useMemo(
    () =>
      isDayVariant
        ? {
            alignSelf: "stretch" as const,
            justifyContent: "center" as const,
            paddingLeft: theme.primitives.space[4],
          }
        : null,
    [isDayVariant, theme],
  );

  const railStyle = useMemo(
    () =>
      isDayVariant
        ? {
            width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
            height: "80%" as const,
            borderRadius: theme.primitives.radius.full,
            backgroundColor: typeColor,
            opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
          }
        : {
            width: MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
            backgroundColor: typeColor,
            opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
          },
    [hasType, isDayVariant, theme, typeColor],
  );

  const bodyStyle = useMemo(
    () => ({
      flex: 1,
      minWidth: 0,
      paddingHorizontal: isDayVariant
        ? theme.primitives.space[4]
        : theme.primitives.space[2],
      paddingVertical: isDayVariant
        ? theme.primitives.space[4]
        : theme.primitives.space[2],
      justifyContent:
        isDayVariant && !isCompactDayEvent
          ? ("flex-start" as const)
          : ("center" as const),
      alignItems: isDayVariant ? ("stretch" as const) : ("center" as const),
      overflow: "hidden" as const,
    }),
    [isCompactDayEvent, isDayVariant, theme],
  );

  const titleStyle = useMemo(
    () =>
      isDayVariant
        ? {
            color: theme.colors.text,
            fontSize: theme.primitives.fontSize.sm,
            lineHeight: theme.primitives.lineHeight.sm,
            fontWeight: theme.primitives.fontWeight.semibold as "600",
          }
        : {
            color: theme.colors.text,
            fontSize: 9,
            lineHeight: 11,
            fontWeight: theme.primitives.fontWeight.medium as "500",
          },
    [isDayVariant, theme],
  );

  /** Rotated title runs along the event height in narrow week columns. */
  const weekVerticalTitleSlotStyle = useMemo(() => {
    const verticalPad = theme.primitives.space[2] * 2;
    const runLength = Math.max(0, height - verticalPad);
    const lineBox = 11;
    return {
      width: lineBox,
      height: runLength,
      overflow: "hidden" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    };
  }, [height, theme]);

  const weekVerticalTitleStyle = useMemo(() => {
    const verticalPad = theme.primitives.space[2] * 2;
    const runLength = Math.max(0, height - verticalPad);
    return {
      ...titleStyle,
      width: runLength,
      textAlign: "center" as const,
      transform: [{ rotate: "90deg" as const }],
    };
  }, [height, theme, titleStyle]);

  const timeStyle = useMemo(
    () => ({
      marginTop: theme.primitives.space[2],
      color: theme.colors.textMuted,
      fontSize: theme.primitives.fontSize.xs,
      lineHeight: theme.primitives.lineHeight.xs,
      fontWeight: theme.primitives.fontWeight.regular as "400",
    }),
    [theme],
  );

  const listTitle = formatAppointmentEventTitle(event.title, event.typeName);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${listTitle}, ${timeRange}`}
      onPress={onPress}
      style={rootStyle}
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
                <Text style={{ color: theme.colors.text }}>{subjectLabel}</Text>
                {event.typeName ? (
                  <Text style={{ color: theme.colors.text }}> - </Text>
                ) : null}
                {event.typeName ? (
                  <Text style={{ color: typeColor }}>{event.typeName}</Text>
                ) : null}
                <Text style={timeStyle}>, {timeRange}</Text>
              </Text>
            ) : (
              <>
                <Text numberOfLines={1} style={titleStyle}>
                  <Text style={{ color: theme.colors.text }}>
                    {subjectLabel}
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
              </>
            )
          ) : (
            <View style={weekVerticalTitleSlotStyle}>
              <Text numberOfLines={1} style={weekVerticalTitleStyle}>
                {event.title}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const WeekEventBlock = memo(WeekEventBlockComponent);
