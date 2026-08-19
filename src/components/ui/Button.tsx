import React, { useCallback, useRef } from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutRectangle,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

import { ThemedText } from "./ThemedText";

type ButtonTone = "neutral" | "brand" | "accent" | "success" | "alert";
type ButtonVariant = "solid" | "soft" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonTonePalette = {
  default: string;
  subtle: string;
  strong: string;
  text: string;
};

export type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  icon?: React.ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
};

function resolveTone(
  theme: ReturnType<typeof useThemeTokens>,
  tone: ButtonTone
): ButtonTonePalette {
  switch (tone) {
    case "brand":
      return theme.palette.brand;
    case "accent":
      return theme.palette.accent;
    case "success":
      return {
        default: theme.palette.success.DEFAULT,
        subtle: theme.palette.success.subtle,
        strong: theme.palette.success.strong,
        text: theme.palette.success.text,
      };
    case "alert":
      return {
        default: theme.palette.alert.DEFAULT,
        subtle: theme.palette.alert.subtle,
        strong: theme.palette.alert.strong,
        text: theme.palette.alert.text,
      };
    case "neutral":
    default:
      return {
        default: theme.palette.surface.inverse,
        subtle: theme.palette.surface.sunken,
        strong: theme.palette.surface.inverse,
        text: theme.palette.foreground.inverse,
      };
  }
}

function resolveHeight(theme: ReturnType<typeof useThemeTokens>, size: ButtonSize) {
  switch (size) {
    case "sm":
      return theme.semantic.size["control-sm"];
    case "lg":
      return theme.semantic.size["control-lg"];
    case "md":
    default:
      return theme.semantic.size.control;
  }
}

const RIPPLE_DURATION = 400;
const RIPPLE_OPACITY = 0.18;

export function Button({
  label,
  icon,
  tone = "brand",
  variant = "solid",
  size = "md",
  disabled,
  className,
  textClassName,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const theme = useThemeTokens();
  const tonePalette = resolveTone(theme, tone);
  const layoutRef = useRef<LayoutRectangle | null>(null);

  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  const rippleRadius = useSharedValue(0);

  const startRipple = useCallback(
    (x: number, y: number) => {
      const layout = layoutRef.current;
      if (!layout) return;

      const dx = Math.max(x, layout.width - x);
      const dy = Math.max(y, layout.height - y);
      const radius = Math.sqrt(dx * dx + dy * dy);

      rippleX.value = x;
      rippleY.value = y;
      rippleRadius.value = radius;
      rippleScale.value = 0;
      rippleOpacity.value = RIPPLE_OPACITY;
      rippleScale.value = withTiming(1, { duration: RIPPLE_DURATION });
    },
    [rippleOpacity, rippleRadius, rippleScale, rippleX, rippleY],
  );

  const endRipple = useCallback(() => {
    rippleOpacity.value = withTiming(0, { duration: 250 });
  }, [rippleOpacity]);

  const rippleStyle = useAnimatedStyle(() => {
    const d = rippleRadius.value * 2;
    return {
      position: "absolute",
      left: rippleX.value - rippleRadius.value,
      top: rippleY.value - rippleRadius.value,
      width: d,
      height: d,
      borderRadius: rippleRadius.value,
      backgroundColor:
        variant === "solid" ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)",
      opacity: rippleOpacity.value,
      transform: [{ scale: rippleScale.value }],
    };
  });

  const backgroundColor =
    variant === "solid"
      ? tonePalette.default
      : variant === "soft"
        ? tonePalette.subtle
        : "transparent";
  const borderColor =
    variant === "outline" ? tonePalette.default : "transparent";
  const labelColor =
    variant === "solid"
      ? tonePalette.text
      : tone === "neutral"
        ? theme.palette.foreground.default
        : tonePalette.default;

  return (
    <Pressable
      accessibilityRole="button"
      className={className}
      disabled={disabled}
      onLayout={(e) => {
        layoutRef.current = e.nativeEvent.layout;
      }}
      onPressIn={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        startRipple(locationX, locationY);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        endRipple();
        onPressOut?.(event);
      }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.semantic.space.gap.compact,
          minHeight: resolveHeight(theme, size),
          paddingHorizontal: theme.semantic.space.inline.default,
          borderRadius: theme.semantic.radius.control,
          backgroundColor,
          borderColor,
          borderWidth:
            borderColor === "transparent"
              ? 0
              : theme.semantic.borderWidth.strong,
          opacity: disabled ? theme.semantic.opacity.disabled : 1,
          overflow: "hidden",
        },
        style,
      ]}
      {...props}
    >
      <Animated.View pointerEvents="none" style={rippleStyle} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.semantic.space.gap.compact }}>
        {icon}
        <ThemedText
          className={cn("text-center", textClassName)}
          style={{ color: labelColor }}
          variant="label"
        >
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}
