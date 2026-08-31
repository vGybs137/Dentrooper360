import { useMemo } from "react";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
  type EdgeInsets,
} from "react-native-safe-area-context";

const INITIAL_INSETS: EdgeInsets = initialWindowMetrics?.insets ?? {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/** Never below native launch metrics — avoids 0→N inset jumps on first paint. */
export function stableSafeAreaInsets(live: EdgeInsets): EdgeInsets {
  return {
    top: Math.max(live.top, INITIAL_INSETS.top),
    right: Math.max(live.right, INITIAL_INSETS.right),
    bottom: Math.max(live.bottom, INITIAL_INSETS.bottom),
    left: Math.max(live.left, INITIAL_INSETS.left),
  };
}

export function useStableSafeAreaInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  return useMemo(
    () => stableSafeAreaInsets(insets),
    [insets.bottom, insets.left, insets.right, insets.top],
  );
}
