import { useRouter, type Href } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import {
  MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
  MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
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

  const onPress = useCallback(() => {
    router.push(`/appointments/${event.id}` as Href);
  }, [event.id, router]);

  const rootStyle = useMemo(
    (): ViewStyle => ({
      position: "absolute",
      top,
      left: `${left * 100}%`,
      width: `${width * 100}%`,
      height,
      paddingHorizontal: 1,
    }),
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

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
      backgroundColor: typeColor,
      opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
    }),
    [hasType, typeColor],
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
      justifyContent: isDayVariant ? ("flex-start" as const) : ("center" as const),
    }),
    [isDayVariant, theme],
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={onPress}
      style={rootStyle}
    >
      <View style={cardStyle}>
        <View style={railStyle} />
        <View style={bodyStyle}>
          {isDayVariant ? (
            <>
              <Text numberOfLines={1} style={titleStyle}>
                <Text style={{ color: theme.colors.text }}>{event.title}</Text>
                {event.typeName ? (
                  <Text style={{ color: theme.colors.text }}> · </Text>
                ) : null}
                {event.typeName ? (
                  <Text style={{ color: typeColor }}>{event.typeName}</Text>
                ) : null}
              </Text>
              <Text numberOfLines={1} style={timeStyle}>
                {timeRange}
              </Text>
            </>
          ) : (
            <Text numberOfLines={1} style={titleStyle}>
              {event.title}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const WeekEventBlock = memo(WeekEventBlockComponent);
