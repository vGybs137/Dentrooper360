import React from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

import { Stack } from "./Stack";
import { ThemedText } from "./ThemedText";

type FieldSize = "sm" | "md" | "lg";
type FieldVariant = "outline" | "soft";

export type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
};

function resolveHeight(theme: ReturnType<typeof useThemeTokens>, size: FieldSize) {
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

export function TextField({
  label,
  hint,
  error,
  size = "md",
  variant = "outline",
  className,
  containerClassName,
  style,
  placeholderTextColor,
  ...props
}: TextFieldProps) {
  const theme = useThemeTokens();
  const borderColor = error
    ? theme.palette.alert.DEFAULT
    : theme.palette.border.default;
  const inputStyle: TextStyle = {
    color: theme.palette.foreground.default,
    fontSize: theme.semantic.type.body.fontSize,
    lineHeight: theme.semantic.type.body.lineHeight,
    fontWeight: theme.semantic.type.body.fontWeight as TextStyle["fontWeight"],
    paddingVertical: theme.semantic.space.stack.compact,
  };

  return (
    <Stack className={containerClassName} space="compact">
      {label ? <ThemedText variant="label">{label}</ThemedText> : null}
      <View
        style={[
          {
            minHeight: resolveHeight(theme, size),
            borderRadius: theme.semantic.radius.control,
            borderWidth: theme.semantic.borderWidth.subtle,
            borderColor,
            backgroundColor:
              variant === "soft"
                ? theme.palette.surface.sunken
                : theme.palette.surface.raised,
            justifyContent: "center",
            paddingHorizontal: theme.semantic.space.inline.default,
          },
          style,
        ]}
      >
        <TextInput
          className={cn("text-body", className)}
          placeholderTextColor={
            placeholderTextColor ?? theme.palette.foreground.muted
          }
          style={inputStyle}
          {...props}
        />
      </View>
      {error ? (
        <ThemedText tone="alert" variant="label">
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText tone="muted" variant="label">
          {hint}
        </ThemedText>
      ) : null}
    </Stack>
  );
}
