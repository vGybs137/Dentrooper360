import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import { useThemeTokens } from "@/theme";

import {
  MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";

export type DayEventChipProps = {
  event: MonthDayEventPreview;
};

/** Compact in-cell event: type-color left rail + title. */
function DayEventChipComponent({ event }: DayEventChipProps) {
  const theme = useThemeTokens();
  const hasType = Boolean(event.color);
  const railColor = event.color ?? theme.palette.border.strong;

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.primitives.space[2],
      minHeight: theme.semantic.space.stack.comfortable,
      overflow: "hidden" as const,
    }),
    [theme],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
      alignSelf: "stretch" as const,
      minHeight: theme.semantic.space.stack.compact + theme.primitives.space[2],
      borderRadius: theme.primitives.radius.xs / 2,
      backgroundColor: railColor,
      opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
    }),
    [hasType, railColor, theme],
  );

  // Compact cell type — avoid ThemedText `text-body` class which overpowers in-cell size.
  const titleStyle = useMemo(
    () => ({
      flex: 1,
      color: theme.palette.foreground.default,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: theme.primitives.fontWeight.medium as "500",
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      <View style={railStyle} />
      <Text numberOfLines={1} style={titleStyle}>
        {event.title}
      </Text>
    </View>
  );
}

export const DayEventChip = memo(DayEventChipComponent);
