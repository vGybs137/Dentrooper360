import { memo, useMemo } from "react";
import { Text, type ViewStyle } from "react-native";

import { Button } from "@/components/ui";

import { timedGridAbsoluteStyle } from "@/components/schedule/timedGrid/timedGridPositionStyle";
import { TIMED_GRID_OVERFLOW_MIN_HEIGHT } from "@/constants/schedule";
import { useThemeTokens } from "@/theme";

export type TimedGridOverflowChipProps = {
  count: number;
  top: number;
  height: number;
  left: number;
  width: number;
};

function TimedGridOverflowChipComponent({
  count,
  top,
  height,
  left,
  width,
}: TimedGridOverflowChipProps) {
  const theme = useThemeTokens();

  const style = useMemo(
    (): ViewStyle => ({
      ...timedGridAbsoluteStyle(
        { top, height, left, width },
        { minHeight: TIMED_GRID_OVERFLOW_MIN_HEIGHT, zIndex: 4 },
      ),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.primitives.radius.xs,
      backgroundColor: theme.palette.surface.sunken,
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.colors.borderSubtle,
    }),
    [height, left, theme, top, width],
  );

  const labelStyle = useMemo(
    () => ({
      color: theme.colors.textMuted,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: theme.primitives.fontWeight.semibold as "600",
    }),
    [theme],
  );

  return (
    <Button
      accessibilityLabel={`${count} more overlapping appointments`}
      nestedScroll
      ripple={false}
      size="none"
      style={style}
      tone="neutral"
      variant="ghost"
    >
      <Text style={labelStyle}>{`+${count}`}</Text>
    </Button>
  );
}

export const TimedGridOverflowChip = memo(TimedGridOverflowChipComponent);
