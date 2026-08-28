import { memo, useMemo } from "react";
import { Text, View } from "react-native";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";


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
  const native = useNativeColors();
  const hasType = Boolean(event.color);
  const railColor = event.color ?? native.border.strong;

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: primitives.space[2],
      minHeight: semantic.space.stack.comfortable,
      overflow: "hidden" as const,
    }),
    [],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_CHIP_RAIL_WIDTH,
      alignSelf: "stretch" as const,
      minHeight: semantic.space.stack.compact + primitives.space[2],
      borderRadius: primitives.radius.xs / 2,
      backgroundColor: railColor,
      opacity: hasType ? 1 : MONTH_VIEW_UNTYPED_OPACITY,
    }),
    [hasType, railColor, native],
  );

  // Compact cell type — avoid ThemedText `text-body` class which overpowers in-cell size.
  const titleStyle = useMemo(
    () => ({
      flex: 1,
      color: native.foreground.default,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: primitives.fontWeight.medium as "500",
    }),
    [native],
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
