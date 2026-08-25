import { SymbolView } from "expo-symbols";
import { memo, useMemo } from "react";
import { Pressable } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { useThemeTokens } from "@/theme";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

export type AppointmentSearchBackButtonProps = {
  scrollY: SharedValue<number>;
  initialTop: number;
  pinnedTop: number;
  collapseScrollDistance: number;
  safeAreaTop: number;
  safeAreaLeft: number;
  onPress: () => void;
};

function AppointmentSearchBackButtonComponent({
  scrollY,
  initialTop,
  pinnedTop,
  collapseScrollDistance,
  safeAreaTop,
  safeAreaLeft,
  onPress,
}: AppointmentSearchBackButtonProps) {
  const theme = useThemeTokens();
  const touchSize = theme.semantic.size.touch;
  const pageInset = theme.semantic.space.page;

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    top: Math.max(
      safeAreaTop + pinnedTop,
      safeAreaTop + initialTop - scrollY.value,
    ),
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [collapseScrollDistance, collapseScrollDistance + 1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: progress,
    };
  });

  const hitStyle = useMemo(
    () => ({
      width: touchSize,
      height: touchSize,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    }),
    [touchSize],
  );

  const circleStyle = useMemo(
    () => ({
      ...hitStyle,
      position: "absolute" as const,
      borderRadius: touchSize / 2,
      backgroundColor: theme.palette.surface.raised,
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.colors.borderStrong,
    }),
    [hitStyle, theme],
  );

  const slotStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: safeAreaLeft + pageInset,
      zIndex: theme.semantic.zIndex.sticky,
    }),
    [pageInset, safeAreaLeft, theme],
  );

  return (
    <Animated.View pointerEvents="box-none" style={[slotStyle, containerAnimatedStyle]}>
      <Pressable
        accessibilityLabel="Back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPress}
        style={hitStyle}
      >
        <Animated.View pointerEvents="none" style={[circleStyle, circleAnimatedStyle]} />
        <SymbolView
          name={CHEVRON_LEFT_ICON}
          size={theme.semantic.size.icon}
          tintColor={theme.palette.foreground.default}
        />
      </Pressable>
    </Animated.View>
  );
}

export const AppointmentSearchBackButton = memo(AppointmentSearchBackButtonComponent);
