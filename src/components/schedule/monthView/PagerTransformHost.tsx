import { type ReactNode } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { SHEET_OPEN_HOST_SCALE_Y } from "./PagerShrinkContext";

export type PagerTransformHostProps = {
  children: ReactNode;
  /** gorhom animatedIndex: -1 closed, 0 open at 45%. */
  animatedIndex: SharedValue<number>;
  /** Measured host height for top-anchored translate compensation. */
  hostHeight: number;
  onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * Fixed layout height host. Visually shrinks children with top-anchored scaleY
 * as the bottom sheet opens — does not change layout height / onLayout of the grid.
 */
export function PagerTransformHost({
  children,
  animatedIndex,
  hostHeight,
  onLayout,
}: PagerTransformHostProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      animatedIndex.value,
      [-1, 0],
      [1, SHEET_OPEN_HOST_SCALE_Y],
      Extrapolation.CLAMP,
    );
    const height = hostHeight > 0 ? hostHeight : 0;
    const translateY = ((1 - scaleY) * -height) / 2;

    return {
      transform: [{ translateY }, { scaleY }],
    };
  }, [hostHeight]);

  return (
    <Animated.View onLayout={onLayout} style={[styles.host, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    overflow: "hidden",
    width: "100%",
  },
});
