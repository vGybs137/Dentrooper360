import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { cva, type VariantProps } from "class-variance-authority";
import React, { forwardRef, type ReactNode } from "react";
import {
  useController,
  useFormContext,
  type UseControllerProps,
} from "react-hook-form";
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useNativeColors } from "@/theme";
import { cn } from "@/utils/cn";

const themedTextVariants = cva("shrink", {
  variants: {
    variant: {
      label: "text-label",
      body: "text-body",
      title: "text-title",
      display: "text-display",
    },
    tone: {
      default: "text-foreground-default",
      muted: "text-foreground-muted",
      inverse: "text-foreground-inverse",
      brand: "text-brand-default",
      accent: "text-accent-default",
      success: "text-success-default",
      alert: "text-alert-default",
    },
    align: {
      auto: "",
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "default",
    align: "auto",
  },
});

type FieldSize = "sm" | "md" | "lg";
type FieldVariant = "outline" | "soft" | "bare";

const SIZE_MIN_HEIGHT: Record<FieldSize, string> = {
  sm: "min-h-control-sm",
  md: "min-h-control",
  lg: "min-h-control-lg",
};

export type ThemedTextDisplayProps = TextProps &
  VariantProps<typeof themedTextVariants> & {
    as?: "text";
    className?: string;
    style?: StyleProp<TextStyle>;
  };

export type ThemedTextInputProps = Omit<TextInputProps, "style"> & {
  as: "input";
  name?: UseControllerProps["name"];
  rules?: UseControllerProps["rules"];
  fieldVariant?: FieldVariant;
  size?: FieldSize;
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  bottomSheetInput?: boolean;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
};

export type ThemedTextProps = ThemedTextDisplayProps | ThemedTextInputProps;

export function ThemedText(props: ThemedTextDisplayProps): React.ReactElement;
export function ThemedText(props: ThemedTextInputProps): React.ReactElement;
export function ThemedText(props: ThemedTextProps) {
  if (props.as === "input") {
    if (props.name != null) {
      return <ControlledThemedTextInput {...props} name={props.name} />;
    }

    return <ThemedTextInput {...props} />;
  }

  const {
    as: _as,
    variant = "body",
    tone = "default",
    align = "auto",
    className,
    style,
    ...rest
  } = props;

  return (
    <Text
      className={cn(themedTextVariants({ variant, tone, align }), className)}
      style={style}
      {...rest}
    />
  );
}

function ControlledThemedTextInput({
  name,
  rules,
  error,
  onBlur,
  onChangeText,
  value,
  ...props
}: ThemedTextInputProps & { name: NonNullable<ThemedTextInputProps["name"]> }) {
  const formContext = useFormContext();
  const { field, fieldState } = useController({
    control: formContext.control,
    name,
    rules,
  });

  return (
    <ThemedTextInput
      {...props}
      error={error ?? fieldState.error?.message}
      onBlur={(event) => {
        field.onBlur();
        onBlur?.(event);
      }}
      onChangeText={(text) => {
        field.onChange(text);
        onChangeText?.(text);
      }}
      ref={field.ref}
      value={value ?? field.value}
    />
  );
}

const ThemedTextInput = forwardRef<
  TextInput,
  ThemedTextInputProps
>(function ThemedTextInput(
  {
    as: _as,
    name: _name,
    rules: _rules,
    fieldVariant = "outline",
    size = "md",
    label,
    hint,
    error,
    leading,
    trailing,
    bottomSheetInput = false,
    className,
    containerClassName,
    style,
    placeholderTextColor,
    multiline,
    ...props
  },
  ref,
) {
  const nativeColors = useNativeColors();
  const isBare = fieldVariant === "bare";
  const Input = bottomSheetInput ? BottomSheetTextInput : TextInput;

  return (
    <View className={cn("gap-gap-compact", containerClassName)}>
      {label ? <ThemedText variant="label">{label}</ThemedText> : null}
      <View
        className={cn(
          "flex-row items-center gap-gap-compact",
          SIZE_MIN_HEIGHT[size],
          isBare
            ? "rounded-none border-0 bg-transparent px-0"
            : cn(
                "rounded-control border-subtle px-inline",
                fieldVariant === "soft"
                  ? "bg-surface-sunken"
                  : "bg-surface-raised",
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
            placeholderTextColor ?? nativeColors.foreground.muted
          }
          ref={ref as never}
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
    </View>
  );
});
