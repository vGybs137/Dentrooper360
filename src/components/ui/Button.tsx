import React from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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

export function Button({
  label,
  tone = "brand",
  variant = "solid",
  size = "md",
  disabled,
  className,
  textClassName,
  style,
  ...props
}: ButtonProps) {
  const theme = useThemeTokens();
  const tonePalette = resolveTone(theme, tone);

  const backgroundColor =
    variant === "solid"
      ? tonePalette.default
      : variant === "soft"
        ? tonePalette.subtle
        : "transparent";
  const borderColor =
    variant === "outline" ? tonePalette.default : "transparent";
  const textTone =
    variant === "solid"
      ? tone === "neutral"
        ? "inverse"
        : "inverse"
      : tone === "neutral"
        ? "default"
        : tone;

  return (
    <Pressable
      accessibilityRole="button"
      className={cn("items-center justify-center rounded-control", className)}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: resolveHeight(theme, size),
          paddingHorizontal: theme.semantic.space.inline.default,
          borderRadius: theme.semantic.radius.control,
          backgroundColor,
          borderColor,
          borderWidth: borderColor === "transparent" ? 0 : theme.semantic.borderWidth.strong,
          opacity: disabled
            ? theme.semantic.opacity.disabled
            : pressed
              ? 0.82
              : 1,
        },
        style,
      ]}
      {...props}
    >
      <ThemedText
        className={cn("text-center", textClassName)}
        tone={textTone}
        variant="label"
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
