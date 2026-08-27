import { TouchableOpacity as BottomSheetTouchableOpacity } from "@gorhom/bottom-sheet";
import { cva } from "class-variance-authority";
import React, { useRef } from "react";
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

import { cn } from "@/utils/cn";

import { ThemedText } from "./ThemedText";

type ButtonTone = "neutral" | "brand" | "accent" | "success" | "alert";
type ButtonVariant = "solid" | "soft" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  icon?: React.ReactNode;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Use gorhom touchable so presses register inside bottom sheets. */
  bottomSheet?: boolean;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
};

const buttonVariants = cva(
  "flex-row items-center justify-center overflow-hidden rounded-control gap-gap-compact px-inline",
  {
    variants: {
      size: {
        sm: "min-h-control-sm",
        md: "min-h-control",
        lg: "min-h-control-lg",
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
  tone = "brand",
  variant = "solid",
  size = "md",
  bottomSheet = false,
  disabled,
  className,
  textClassName,
  style,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  accessibilityState,
  testID,
}: ButtonProps) {
  const layoutRef = useRef<LayoutRectangle | null>(null);

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

  const handleLayout = (event: {
    nativeEvent: { layout: LayoutRectangle };
  }) => {
    layoutRef.current = event.nativeEvent.layout;
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    startRipple(locationX, locationY);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    endRipple();
    onPressOut?.(event);
  };

  const composedClassName = cn(
    buttonVariants({ size, variant, tone, disabled: Boolean(disabled) }),
    className,
  );
  const labelClassName = cn(buttonTextVariants({ variant, tone }), textClassName);

  const content = (
    <>
      <Animated.View pointerEvents="none" style={rippleStyle} />
      <View className="flex-row items-center gap-gap-compact">
        {icon}
        <ThemedText className={labelClassName} variant="label">
          {label}
        </ThemedText>
      </View>
    </>
  );

  if (bottomSheet) {
    return (
      <BottomSheetTouchableOpacity
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        activeOpacity={0.85}
        disabled={disabled ?? undefined}
        onLayout={handleLayout}
        onPress={onPress}
        style={style}
        testID={testID}
      >
        <View className={composedClassName}>
          {icon}
          <ThemedText className={labelClassName} variant="label">
            {label}
          </ThemedText>
        </View>
      </BottomSheetTouchableOpacity>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      className={composedClassName}
      disabled={disabled}
      onLayout={handleLayout}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}
