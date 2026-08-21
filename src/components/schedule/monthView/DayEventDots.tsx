import { View } from "react-native";

import { useThemeTokens } from "@/theme";

import type { MonthDayEventPreview } from "./types";

export type DayEventDotsProps = {
  events: MonthDayEventPreview[];
};

const MAX_VISIBLE_DOTS = 5;
const DOT_SIZE = 6;

/** Compact type-colored dots for the week-pinned (sheet open) calendar. */
export function DayEventDots({ events }: DayEventDotsProps) {
  const theme = useThemeTokens();
  const visible = events.slice(0, MAX_VISIBLE_DOTS);
  const overflow = events.length - visible.length;

  if (visible.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 1,
      }}
    >
      {visible.map((event) => (
        <View
          key={event.id}
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: event.color ?? theme.palette.border.strong,
            opacity: event.color ? 1 : 0.55,
          }}
        />
      ))}
      {overflow > 0 ? (
        <View
          style={{
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: theme.palette.foreground.muted,
            opacity: 0.45,
          }}
        />
      ) : null}
    </View>
  );
}
