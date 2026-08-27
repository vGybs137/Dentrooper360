import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { type ReactNode } from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

type FieldSize = "sm" | "md" | "lg";
type FieldVariant = "outline" | "soft" | "bare";

export type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  /** Use gorhom BottomSheetTextInput so the sheet reacts to keyboard focus. */
  bottomSheetInput?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
};

const SIZE_MIN_HEIGHT: Record<FieldSize, string> = {
  sm: "min-h-control-sm",
  md: "min-h-control",
  lg: "min-h-control-lg",
};

export function TextField({
  label,
  hint,
  error,
  size = "md",
  variant = "outline",
  bottomSheetInput = false,
  leading,
  trailing,
  className,
  containerClassName,
  style,
  placeholderTextColor,
  multiline,
  ...props
}: TextFieldProps) {
  const theme = useThemeTokens();
  const isBare = variant === "bare";
  const Input = bottomSheetInput ? BottomSheetTextInput : TextInput;

  return (
    <ThemedView className={containerClassName} space="compact" variant="stack">
      {label ? <ThemedText variant="label">{label}</ThemedText> : null}
      <View
        className={cn(
          "flex-row items-center gap-gap-compact",
          SIZE_MIN_HEIGHT[size],
          isBare
            ? "rounded-none border-0 bg-transparent px-0"
            : cn(
                "rounded-control border-subtle px-inline",
                variant === "soft" ? "bg-surface-sunken" : "bg-surface-raised",
                error ? "border-alert" : "border-border",
              ),
        )}
        style={style}
      >
        {leading}
        <Input
          {...props}
          className={cn(
            "flex-1 py-stack-compact text-body text-foreground-default",
            multiline && "w-full",
            className,
          )}
          multiline={multiline}
          placeholderTextColor={
            placeholderTextColor ?? theme.palette.foreground.muted
          }
          textAlignVertical={multiline ? "top" : props.textAlignVertical}
        />
        {trailing}
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
    </ThemedView>
  );
}
