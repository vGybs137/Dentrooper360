import { memo, useMemo } from "react";
import { View } from "react-native";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";

import { ThemedText } from "@/components/ui";

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
  const native = useNativeColors();
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
      gap: primitives.space[2],
      paddingHorizontal: primitives.space[2] / 2,
    }),
    [native],
  );

  const untypedDotStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_DOT_SIZE,
      height: MONTH_VIEW_EVENT_DOT_SIZE,
      borderRadius: MONTH_VIEW_EVENT_DOT_SIZE / 2,
      backgroundColor: native.border.strong,
      opacity: MONTH_VIEW_UNTYPED_OPACITY,
    }),
    [native.border.strong],
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
      {overflow > 0 ? (
        <ThemedText tone="muted" style={{ fontSize: 9, lineHeight: 11 }}>
          +{overflow}
        </ThemedText>
      ) : null}
    </View>
  );
}

export const DayEventDots = memo(DayEventDotsComponent);
