import { memo, useMemo } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import {
  MONTH_VIEW_EVENT_CARD_BRAND_ALPHA,
  MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
import { withOpacity } from "@/helpers/color";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";

export type WeekEventBlockProps = {
  event: MonthDayEventPreview;
  top: number;
  height: number;
  /** Fractional offset within the day column (0–1). */
  left: number;
  /** Fractional width within the day column (0–1). */
  width: number;
};

function WeekEventBlockComponent({
  event,
  top,
  height,
  left,
  width,
}: WeekEventBlockProps) {
  const theme = useThemeTokens();
  const hasType = Boolean(event.color);
  const typeColor = event.color ?? theme.palette.border.strong;

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
      paddingHorizontal: theme.primitives.space[2],
      paddingVertical: theme.primitives.space[2],
      justifyContent: "center" as const,
    }),
    [theme],
  );

  const titleStyle = useMemo(
    () => ({
      color: theme.colors.text,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: theme.primitives.fontWeight.medium as "500",
    }),
    [theme],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}`}
      style={rootStyle}
    >
      <View style={cardStyle}>
        <View style={railStyle} />
        <View style={bodyStyle}>
          <Text style={titleStyle}>{event.title}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const WeekEventBlock = memo(WeekEventBlockComponent);
