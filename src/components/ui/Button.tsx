import { TouchableOpacity as BottomSheetTouchableOpacity } from "@gorhom/bottom-sheet";
import { cva } from "class-variance-authority";
import React, { useRef } from "react";
import {
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutRectangle,
  type PressableProps,
} from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/utils/cn";

import { ThemedText } from "./ThemedText";

type ButtonTone = "neutral" | "brand" | "accent" | "success" | "alert";
type ButtonVariant = "solid" | "soft" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "none";

export type ButtonProps = Omit<PressableProps, "children"> & {
  label?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Use gorhom touchable so presses register inside bottom sheets. */
  bottomSheet?: boolean;
  /** Gesture-handler Pressable so nested pagers/scroll views still receive taps. */
  nestedScroll?: boolean;
  /** Ink ripple. Off for dense grids where it fights layout. */
  ripple?: boolean;
  className?: string;
  textClassName?: string;
};

const buttonVariants = cva("overflow-hidden rounded-control gap-gap-compact", {
  variants: {
    size: {
      sm: "min-h-control-sm flex-row items-center justify-center px-inline",
      md: "min-h-control flex-row items-center justify-center px-inline",
      lg: "min-h-control-lg flex-row items-center justify-center px-inline",
      none: "min-h-0 px-0 rounded-none",
    },
      variant: {
        solid: "border-0",
        soft: "border-0",
        outline: "border-strong bg-transparent",
        ghost: "border-0 bg-transparent",
      },
      tone: {
        brand: "",
        accent: "",
        success: "",
        alert: "",
        neutral: "",
      },
      disabled: {
        true: "opacity-disabled",
        false: "",
      },
      iconOnly: {
        true: "aspect-square px-0",
        false: "",
      },
    },
    compoundVariants: [
      { variant: "solid", tone: "brand", class: "bg-brand-default" },
      { variant: "solid", tone: "accent", class: "bg-accent-default" },
      { variant: "solid", tone: "success", class: "bg-success-default" },
      { variant: "solid", tone: "alert", class: "bg-alert-default" },
      { variant: "solid", tone: "neutral", class: "bg-surface-inverse" },
      { variant: "soft", tone: "brand", class: "bg-brand-subtle" },
      { variant: "soft", tone: "accent", class: "bg-accent-subtle" },
      { variant: "soft", tone: "success", class: "bg-success-subtle" },
      { variant: "soft", tone: "alert", class: "bg-alert-subtle" },
      { variant: "soft", tone: "neutral", class: "bg-surface-sunken" },
      { variant: "outline", tone: "brand", class: "border-brand-default" },
      { variant: "outline", tone: "accent", class: "border-accent-default" },
      { variant: "outline", tone: "success", class: "border-success-default" },
      { variant: "outline", tone: "alert", class: "border-alert-default" },
      { variant: "outline", tone: "neutral", class: "border-foreground-default" },
    ],
    defaultVariants: {
      size: "md",
      variant: "solid",
      tone: "brand",
      disabled: false,
      iconOnly: false,
    },
  },
);

const buttonTextVariants = cva("text-center", {
  variants: {
    variant: {
      solid: "",
      soft: "",
      outline: "",
      ghost: "",
    },
    tone: {
      brand: "",
      accent: "",
      success: "",
      alert: "",
      neutral: "",
    },
  },
  compoundVariants: [
    { variant: "solid", tone: "brand", class: "text-brand-text" },
    { variant: "solid", tone: "accent", class: "text-accent-text" },
    { variant: "solid", tone: "success", class: "text-success-text" },
    { variant: "solid", tone: "alert", class: "text-alert-text" },
    { variant: "solid", tone: "neutral", class: "text-foreground-inverse" },
    { variant: ["soft", "outline", "ghost"], tone: "brand", class: "text-brand-default" },
    { variant: ["soft", "outline", "ghost"], tone: "accent", class: "text-accent-default" },
    { variant: ["soft", "outline", "ghost"], tone: "success", class: "text-success-default" },
    { variant: ["soft", "outline", "ghost"], tone: "alert", class: "text-alert-default" },
    {
      variant: ["soft", "outline", "ghost"],
      tone: "neutral",
      class: "text-foreground-default",
    },
  ],
});

const RIPPLE_DURATION = 400;
const RIPPLE_OPACITY = 0.18;

export function Button({
  label,
  icon,
  children,
  tone = "brand",
  variant = "solid",
  size = "md",
  bottomSheet = false,
  nestedScroll = false,
  ripple = true,
  disabled,
  className,
  textClassName,
  style,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  hitSlop,
  testID,
  ...pressableProps
}: ButtonProps) {
  const layoutRef = useRef<LayoutRectangle | null>(null);
  const iconOnly = !label && size !== "none";

  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);
  const rippleRadius = useSharedValue(0);

  const startRipple = (x: number, y: number) => {
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
  };

  const endRipple = () => {
    rippleOpacity.value = withTiming(0, { duration: 250 });
  };

  const rippleStyle = useAnimatedStyle(() => {
    const d = rippleRadius.value * 2;
    return {
      position: "absolute" as const,
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

  const handleLayout = (event: {
    nativeEvent: { layout: LayoutRectangle };
  }) => {
    layoutRef.current = event.nativeEvent.layout;
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    if (ripple) {
      const { locationX, locationY } = event.nativeEvent;
      startRipple(locationX, locationY);
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (ripple) {
      endRipple();
    }
    onPressOut?.(event);
  };

  const composedClassName = cn(
    buttonVariants({
      size,
      variant,
      tone,
      disabled: Boolean(disabled),
      iconOnly,
    }),
    className,
  );
  const labelClassName = cn(buttonTextVariants({ variant, tone }), textClassName);
  const resolvedAccessibilityLabel = accessibilityLabel ?? label;

  const inner = (
    <>
      {ripple ? (
        <Animated.View pointerEvents="none" style={rippleStyle} />
      ) : null}
      {icon}
      {children}
      {label ? (
        <ThemedText className={labelClassName} variant="label">
          {label}
        </ThemedText>
      ) : null}
    </>
  );

  if (bottomSheet) {
    return (
      <BottomSheetTouchableOpacity
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        activeOpacity={0.85}
        disabled={disabled ?? undefined}
        hitSlop={hitSlop ?? undefined}
        onLayout={handleLayout}
        onPress={onPress ?? undefined}
        style={typeof style === "function" ? undefined : style}
        testID={testID}
      >
        <View className={composedClassName}>{inner}</View>
      </BottomSheetTouchableOpacity>
    );
  }

  if (nestedScroll) {
    return (
      <GesturePressable
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        disabled={Boolean(disabled)}
        hitSlop={hitSlop as never}
        onPress={onPress as never}
        onPressIn={handlePressIn as never}
        onPressOut={handlePressOut as never}
        style={style as never}
        testID={testID}
      >
        <View onLayout={handleLayout} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          {inner}
        </View>
      </GesturePressable>
    );
  }

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className={composedClassName}
      disabled={disabled}
      hitSlop={hitSlop}
      onLayout={handleLayout}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      testID={testID}
    >
      {inner}
    </Pressable>
  );
}
