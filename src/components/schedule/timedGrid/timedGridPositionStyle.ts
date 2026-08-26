import type { ViewStyle } from "react-native";

export type TimedGridFractionalRect = {
  /** 0–1 offset from the left of the day column. */
  left: number;
  /** 0–1 width within the day column. */
  width: number;
};

export type TimedGridBlockPlacement = TimedGridFractionalRect & {
  top: number;
  height: number;
};

type TimedGridAbsoluteStyleOptions = {
  zIndex?: number;
  paddingHorizontal?: number;
  minHeight?: number;
};

/** Shared absolute positioning for timed grid blocks and overflow chips. */
export function timedGridAbsoluteStyle(
  { top, height, left, width }: TimedGridBlockPlacement,
  options: TimedGridAbsoluteStyleOptions = {},
): ViewStyle {
  const resolvedHeight =
    options.minHeight != null ? Math.max(height, options.minHeight) : height;

  return {
    position: "absolute",
    top,
    left: `${left * 100}%`,
    width: `${width * 100}%`,
    height: resolvedHeight,
    ...(options.zIndex != null ? { zIndex: options.zIndex } : {}),
    ...(options.paddingHorizontal != null
      ? { paddingHorizontal: options.paddingHorizontal }
      : {}),
  };
}
