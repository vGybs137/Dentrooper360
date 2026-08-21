import { memo, useMemo } from "react";
import { View } from "react-native";

import { useThemeTokens } from "@/theme";

import {
  MONTH_VIEW_EVENT_DOT_SIZE,
  MONTH_VIEW_MAX_VISIBLE_DOTS,
  MONTH_VIEW_UNTYPED_OPACITY,
} from "@/constants/schedule";
import type { MonthDayEventPreview } from "@/types/schedule";

export type DayEventDotsProps = {
  events: MonthDayEventPreview[];
};

/** Compact type-colored dots for the week-pinned (sheet open) calendar. */
function DayEventDotsComponent({ events }: DayEventDotsProps) {
  const theme = useThemeTokens();
  const visible = useMemo(
    () => events.slice(0, MONTH_VIEW_MAX_VISIBLE_DOTS),
    [events],
  );
  const overflow = events.length - visible.length;

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: theme.primitives.space[2],
      paddingHorizontal: theme.primitives.space[2] / 2,
    }),
    [theme],
  );

  const untypedDotStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_DOT_SIZE,
      height: MONTH_VIEW_EVENT_DOT_SIZE,
      borderRadius: MONTH_VIEW_EVENT_DOT_SIZE / 2,
      backgroundColor: theme.palette.border.strong,
      opacity: MONTH_VIEW_UNTYPED_OPACITY,
    }),
    [theme.palette.border.strong],
  );

  const overflowDotStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_DOT_SIZE,
      height: MONTH_VIEW_EVENT_DOT_SIZE,
      borderRadius: MONTH_VIEW_EVENT_DOT_SIZE / 2,
      backgroundColor: theme.palette.foreground.muted,
      opacity: theme.semantic.opacity.scrim,
    }),
    [theme],
  );

  if (visible.length === 0) return null;

  return (
    <View style={rootStyle}>
      {visible.map((event) => (
        <View
          key={event.id}
          style={
            event.color
              ? {
                  width: MONTH_VIEW_EVENT_DOT_SIZE,
                  height: MONTH_VIEW_EVENT_DOT_SIZE,
                  borderRadius: MONTH_VIEW_EVENT_DOT_SIZE / 2,
                  backgroundColor: event.color,
                }
              : untypedDotStyle
          }
        />
      ))}
      {overflow > 0 ? <View style={overflowDotStyle} /> : null}
    </View>
  );
}

export const DayEventDots = memo(DayEventDotsComponent);
