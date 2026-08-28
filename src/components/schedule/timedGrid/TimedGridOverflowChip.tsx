import { memo, useMemo } from "react";
import { Text, type ViewStyle } from "react-native";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";

import { Button } from "@/components/ui";

import { timedGridAbsoluteStyle } from "@/components/schedule/timedGrid/timedGridPositionStyle";
import { TIMED_GRID_OVERFLOW_MIN_HEIGHT } from "@/constants/schedule";

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
  const native = useNativeColors();

  const style = useMemo(
    (): ViewStyle => ({
      ...timedGridAbsoluteStyle(
        { top, height, left, width },
        { minHeight: TIMED_GRID_OVERFLOW_MIN_HEIGHT, zIndex: 4 },
      ),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: primitives.radius.xs,
      backgroundColor: native.surface.sunken,
      borderWidth: semantic.borderWidth.subtle,
      borderColor: native.border.subtle,
    }),
    [height, left, native, top, width],
  );

  const labelStyle = useMemo(
    () => ({
      color: native.foreground.muted,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: primitives.fontWeight.semibold as "600",
    }),
    [native],
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
