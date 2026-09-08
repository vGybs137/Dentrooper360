import { useEffect, type ReactNode } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useBottomSheetMotion,
  type BottomSheetMotion,
} from "@/hooks/ui/useBottomSheetMotion";
import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";

import { ThemedView, type ThemedViewProps } from "./ThemedView";

export type BottomSheetProps = Omit<ThemedViewProps, "radius" | "inset"> & {
  children: ReactNode;
  /** Slide the sheet in/out. Ignored when `motion` is provided. */
  animated?: boolean;
  /** Controls exit animation when `animated` is true. Defaults to true. */
  visible?: boolean;
  /** Delay before the enter animation starts. */
  enterDelay?: number;
  /** External motion controller (e.g. splash intro coordination). */
  motion?: BottomSheetMotion;
  /** Called after the exit animation completes. */
  onExitComplete?: () => void;
  /** Extra bottom padding added on top of the safe-area inset. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
};

export function BottomSheet({
  children,
  pointerEvents,
  className,
  style,
  surface = "raised",
  bottomInset,
  animated = false,
  visible = true,
  enterDelay = 0,
  motion,
  onExitComplete,
  ...props
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom =
    (bottomInset ?? semantic.space.section) + insets.bottom;

  const internalMotion = useBottomSheetMotion({
    enabled: animated && motion === undefined,
    enterDelay,
  });
  const activeMotion = motion ?? (animated ? internalMotion : undefined);

  useEffect(() => {
    if (!activeMotion || motion !== undefined) {
      return;
    }

    if (visible) {
      activeMotion.restore();
      return;
    }

    activeMotion.dismiss(onExitComplete);
  }, [activeMotion, motion, onExitComplete, visible]);

  const handleLayout = (event: LayoutChangeEvent) => {
    activeMotion?.onLayout(event.nativeEvent.layout.height);
  };

  const sheet = (
    <ThemedView
      className={cn(
        "rounded-t-dialog px-inline-comfortable pt-section",
        className,
      )}
      pointerEvents={pointerEvents}
      surface={surface}
      style={[{ paddingBottom }, style]}
      {...props}
    >
      {children}
    </ThemedView>
  );

  if (!activeMotion?.enabled) {
    return sheet;
  }

  return (
    <Animated.View onLayout={handleLayout} style={activeMotion.animatedStyle}>
      {sheet}
    </Animated.View>
  );
}
